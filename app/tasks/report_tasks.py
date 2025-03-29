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

@celery_app.task
def send_monthly_reports():
    """Generate and send monthly performance reports to users."""
    
    # Create a Flask app context
    app = create_app()
    with app.app_context():
        # Get all regular users
        users = User.query.filter_by(role=Role.USER).all()
        
        # Get the previous month's date range
        today = datetime.now()
        first_day_of_current_month = datetime(today.year, today.month, 1)
        last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
        first_day_of_previous_month = datetime(last_day_of_previous_month.year, 
                                             last_day_of_previous_month.month, 1)
        
        month_name = first_day_of_previous_month.strftime("%B %Y")
        
        # For each user
        for user in users:
            # Get user's quiz attempts from previous month
            monthly_scores = Score.query.filter(
                Score.user_id == user.id,
                Score.time_stamp_of_attempt >= first_day_of_previous_month,
                Score.time_stamp_of_attempt < first_day_of_current_month
            ).all()
            
            # Skip users with no activity in the previous month
            if not monthly_scores:
                continue
            
            # Calculate statistics
            total_attempts = len(monthly_scores)
            total_correct = sum(score.total_scored for score in monthly_scores)
            total_questions = sum(score.max_score for score in monthly_scores)
            avg_score = round((total_correct / total_questions * 100), 2) if total_questions > 0 else 0
            
            # Get subject performance data
            subject_performance = {}
            
            for score in monthly_scores:
                quiz = Quiz.query.get(score.quiz_id)
                chapter = Chapter.query.get(quiz.chapter_id)
                subject = Subject.query.get(chapter.subject_id)
                
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
            except Exception as e:
                print(f"Failed to generate chart: {str(e)}")
            
            # Send email
            subject = f"Your Quiz Master Performance Report - {month_name}"
            
            text_body = render_template('emails/monthly_report.txt', 
                                        user=user,
                                        month=month_name,
                                        total_attempts=total_attempts,
                                        avg_score=avg_score,
                                        subject_stats=subject_stats,
                                        rank=0,  # We're not calculating rank in this simple implementation
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
                print(f"Sent monthly report to {user.username}")
            except Exception as e:
                print(f"Failed to send email to {user.username}: {str(e)}")
        
        return f"Sent monthly reports to all eligible users"

def generate_performance_chart(scores):
    """Generate a chart image for the monthly report."""
    # Sort scores by date
    sorted_scores = sorted(scores, key=lambda x: x.time_stamp_of_attempt)
    
    if not sorted_scores:
        return None
    
    # Prepare data
    dates = [score.time_stamp_of_attempt.strftime('%d %b') for score in sorted_scores]
    percentages = [(score.total_scored / score.max_score * 100) for score in sorted_scores]
    
    # Create chart
    fig, ax = plt.subplots(figsize=(10, 6))
    ax.plot(dates, percentages, marker='o', linestyle='-', color='royalblue')
    ax.set_ylim(0, 100)
    ax.set_xlabel('Date')
    ax.set_ylabel('Score (%)')
    ax.set_title('Your Quiz Performance')
    ax.grid(True, linestyle='--', alpha=0.7)
    
    # If there are many dates, rotate the labels
    if len(dates) > 5:
        plt.xticks(rotation=45)
    
    plt.tight_layout()
    
    # Convert plot to image
    img_bytes = io.BytesIO()
    FigureCanvas(fig).print_png(img_bytes)
    img_bytes.seek(0)
    plot_url = base64.b64encode(img_bytes.getvalue()).decode('utf8')
    
    plt.close(fig)
    
    return plot_url