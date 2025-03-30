# app/tasks/report_tasks.py
from celery_app import celery_app
from app import create_app
from app.models import User, Quiz, Score, Subject, Chapter, Role
from app.utils.email_utils import send_email
from flask import render_template
from datetime import datetime, timedelta
from sqlalchemy import func
import io
import base64
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas



# app/tasks/report_tasks.py
# Update the task with better debugging and test mode

@celery_app.task
def send_monthly_reports(test_mode=False, specific_user_id=None):
    """Generate and send monthly performance reports to users.
    
    Args:
        test_mode: If True, force generate reports even if no activity in previous month
        specific_user_id: If provided, only send report to this user
    """
    print("Starting monthly reports task")
    
    # Create a Flask app context
    app = create_app()
    with app.app_context():
        # Get users to process
        if specific_user_id:
            users = User.query.filter_by(id=specific_user_id).all()
            print(f"Processing specific user ID: {specific_user_id}")
        else:
            users = User.query.filter_by(role=Role.USER).all()
            print(f"Processing {len(users)} users")
        
        # If no users found
        if not users:
            print("No users found to process")
            return "No users found"
        
        # Get the previous month's date range
        today = datetime.now()
        
        if test_mode:
            # For test mode, use current month instead of previous month
            first_day_of_period = datetime(today.year, today.month, 1)
            last_day_of_period = today
            month_name = today.strftime("%B %Y") + " (TEST)"
            print(f"Using TEST MODE with current month: {month_name}")
        else:
            # Normal mode - use previous month
            first_day_of_current_month = datetime(today.year, today.month, 1)
            last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
            first_day_of_period = datetime(last_day_of_previous_month.year, 
                                         last_day_of_previous_month.month, 1)
            last_day_of_period = last_day_of_previous_month
            month_name = first_day_of_period.strftime("%B %Y")
            print(f"Using previous month: {month_name}")
        
        # Track results
        success_count = 0
        error_count = 0
        skip_count = 0
        
        # For each user
        for user in users:
            print(f"Processing user: {user.username} (ID: {user.id})")
            
            # Get user's quiz attempts from the period
            monthly_scores = Score.query.filter(
                Score.user_id == user.id,
                Score.time_stamp_of_attempt >= first_day_of_period,
                Score.time_stamp_of_attempt <= last_day_of_period
            ).all()
            
            print(f"Found {len(monthly_scores)} scores for user")
            
            # Skip users with no activity in the period
            if not monthly_scores and not test_mode:
                print(f"Skipping user {user.username} - no activity")
                skip_count += 1
                continue
            
            try:
                # Use test data if no real data found but test_mode is enabled
                if not monthly_scores and test_mode:
                    print("Creating test scores data for user")
                    
                    # Create fake score data for test mode
                    fake_scores = []
                    
                    # Find a valid quiz in the system
                    quizzes = Quiz.query.limit(1).all()
                    if quizzes:
                        test_quiz = quizzes[0]
                        
                        # Create a fake score for test purposes
                        fake_score = Score(
                            quiz_id=test_quiz.id,
                            user_id=user.id,
                            time_stamp_of_attempt=today - timedelta(days=5),
                            total_scored=8,
                            max_score=10
                        )
                        
                        # Don't save to database, just use for report generation
                        fake_scores.append(fake_score)
                        print(f"Created test score with quiz ID: {test_quiz.id}")
                        
                        monthly_scores = fake_scores
                
                # Calculate statistics
                if monthly_scores:
                    total_attempts = len(monthly_scores)
                    total_correct = sum(score.total_scored for score in monthly_scores)
                    total_questions = sum(score.max_score for score in monthly_scores)
                    avg_score = round((total_correct / total_questions * 100), 2) if total_questions > 0 else 0
                    
                    print(f"User stats: {total_attempts} attempts, {avg_score}% average")
                    
                    # Get subject performance data
                    subject_performance = {}
                    
                    for score in monthly_scores:
                        try:
                            quiz = Quiz.query.get(score.quiz_id)
                            if not quiz:
                                print(f"Warning: Quiz {score.quiz_id} not found")
                                continue
                                
                            chapter = Chapter.query.get(quiz.chapter_id)
                            if not chapter:
                                print(f"Warning: Chapter {quiz.chapter_id} not found")
                                continue
                                
                            subject = Subject.query.get(chapter.subject_id)
                            if not subject:
                                print(f"Warning: Subject {chapter.subject_id} not found")
                                continue
                            
                            if subject.id not in subject_performance:
                                subject_performance[subject.id] = {
                                    'subject_name': subject.name,
                                    'total_correct': 0,
                                    'total_questions': 0,
                                    'attempts': 0
                                }
                            
                            subject_performance[subject.id]['total_correct'] += score.total_scored
                            subject_performance[subject.id]['total_questions'] += score.max_score
                            subject_performance[subject.id]['attempts'] += 1
                        except Exception as e:
                            print(f"Error processing score {score.id}: {str(e)}")
                    
                    # Calculate percentages for each subject
                    subject_stats = []
                    for subject_id, data in subject_performance.items():
                        if data['total_questions'] > 0:
                            percentage = round((data['total_correct'] / data['total_questions']) * 100, 2)
                        else:
                            percentage = 0
                            
                        subject_stats.append({
                            'subject_name': data['subject_name'],
                            'percentage': percentage,
                            'attempts': data['attempts']
                        })
                    
                    # Sort by percentage descending
                    subject_stats.sort(key=lambda x: x['percentage'], reverse=True)
                    
                    # Create performance chart image for the email
                    chart_image = None
                    try:
                        chart_image = generate_performance_chart(monthly_scores)
                        print("Performance chart generated successfully")
                    except Exception as e:
                        print(f"Error generating chart: {str(e)}")
                        import traceback
                        traceback.print_exc()
                    
                    # Send email
                    subject = f"Your Quiz Master Performance Report - {month_name}"
                    
                    text_body = render_template('emails/monthly_report.txt', 
                                                user=user,
                                                month=month_name,
                                                total_attempts=total_attempts,
                                                avg_score=avg_score,
                                                subject_stats=subject_stats,
                                                rank=0,
                                                total_users=len(users))
                    html_body = render_template('emails/monthly_report.html',
                                              user=user,
                                              month=month_name,
                                              total_attempts=total_attempts,
                                              avg_score=avg_score,
                                              subject_stats=subject_stats,
                                              rank=0,
                                              total_users=len(users),
                                              chart_image=chart_image)
                    
                    try:
                        send_email(subject, [user.username], text_body, html_body)
                        print(f"Successfully sent monthly report to {user.username}")
                        success_count += 1
                    except Exception as e:
                        print(f"Failed to send email to {user.username}: {str(e)}")
                        import traceback
                        traceback.print_exc()
                        error_count += 1
            except Exception as e:
                print(f"Error generating report for user {user.username}: {str(e)}")
                import traceback
                traceback.print_exc()
                error_count += 1
        
        result = f"Monthly reports: {success_count} sent, {error_count} errors, {skip_count} skipped"
        print(result)
        return result
    


    

def generate_performance_chart(scores):
    """Generate a chart image for the monthly report."""
    import matplotlib
    matplotlib.use('Agg')  # Force non-interactive backend
    import matplotlib.pyplot as plt
    from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
    import io
    import base64
    
    print(f"Generating chart for {len(scores)} scores")
    
    try:
        # Sort scores by date
        sorted_scores = sorted(scores, key=lambda x: x.time_stamp_of_attempt)
        
        if not sorted_scores:
            print("No scores available for chart")
            return None
        
        # Create a very simple chart for testing
        fig, ax = plt.subplots(figsize=(8, 4))
        
        # Plot a basic bar chart
        dates = [score.time_stamp_of_attempt.strftime('%m/%d') for score in sorted_scores]
        percentages = [(score.total_scored / score.max_score * 100) for score in sorted_scores]
        
        print(f"Chart data - dates: {dates}, percentages: {percentages}")
        
        if len(dates) == 1:
            # For single data point, create a bar chart
            ax.bar(dates, percentages, color='royalblue')
        else:
            # For multiple points, create a line chart
            ax.plot(dates, percentages, 'o-', color='royalblue')
        
        ax.set_ylim(0, 100)
        ax.set_xlabel('Date')
        ax.set_ylabel('Score (%)')
        ax.set_title('Quiz Performance')
        ax.grid(True, linestyle='--', alpha=0.7)
        
        # Convert plot to image
        img_bytes = io.BytesIO()
        FigureCanvas(fig).print_png(img_bytes)
        plt.close(fig)
        
        img_bytes.seek(0)
        plot_url = base64.b64encode(img_bytes.getvalue()).decode('utf8')
        
        print("Chart generation successful")
        return plot_url
        
    except Exception as e:
        print(f"Error in chart generation: {str(e)}")
        import traceback
        traceback.print_exc()
        return None