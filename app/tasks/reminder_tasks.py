# app/tasks/reminder_tasks.py
from celery_app import celery_app
from app import create_app
from app.models import User, Quiz, Score, Subject, Chapter, Role
from app.utils.email_utils import send_email
from flask import render_template
from datetime import datetime, timedelta
from sqlalchemy import func

@celery_app.task
def send_daily_reminders():
    """Send daily reminders to users about new quizzes or reminders to visit."""
    
    # Create a Flask app context
    app = create_app()
    with app.app_context():
        # Get all regular users
        users = User.query.filter_by(role=Role.USER).all()
        
        # Get recent quizzes (created in the last 7 days)
        recent_date = datetime.now().date() - timedelta(days=7)
        recent_quizzes = Quiz.query.filter(Quiz.date_of_quiz >= recent_date).all()
        
        new_quiz_data = []
        for quiz in recent_quizzes:
            chapter = Chapter.query.get(quiz.chapter_id)
            subject = Subject.query.get(chapter.subject_id)
            new_quiz_data.append({
                'quiz_id': quiz.id,
                'quiz_date': quiz.date_of_quiz,
                'chapter_name': chapter.name,
                'subject_name': subject.name
            })
        
        today = datetime.now().date()
        
        # For each user
        for user in users:
            # Check if user has been active recently
            recent_attempts = Score.query.filter_by(user_id=user.id).filter(
                func.date(Score.time_stamp_of_attempt) >= today - timedelta(days=7)
            ).count()
            
            # Skip users who have been active in the last 7 days and have taken at least 3 quizzes
            if recent_attempts >= 3:
                continue
            
            # Get user's recent quiz attempts
            user_attempts = Score.query.filter_by(user_id=user.id).all()
            attempted_quiz_ids = [score.quiz_id for score in user_attempts]
            
            # Filter new quizzes that user hasn't attempted yet
            relevant_quizzes = [quiz for quiz in new_quiz_data if quiz['quiz_id'] not in attempted_quiz_ids]
            
            # Skip if no relevant quizzes
            if not relevant_quizzes and recent_attempts > 0:
                continue
            
            # Determine message type
            if not recent_attempts:
                message_type = "inactivity"
            elif relevant_quizzes:
                message_type = "new_quizzes"
            else:
                message_type = "general"
            
            # Send email
            subject = "Quiz Master: Your Daily Quiz Reminder"
            
            text_body = render_template('emails/daily_reminder.txt', 
                                       user=user,
                                       quizzes=relevant_quizzes[:5],  # Limit to 5 quizzes
                                       message_type=message_type)
            html_body = render_template('emails/daily_reminder.html',
                                       user=user,
                                       quizzes=relevant_quizzes[:5],
                                       message_type=message_type)
            
            try:
                send_email(subject, [user.username], text_body, html_body)
                print(f"Sent reminder email to {user.username}")
            except Exception as e:
                print(f"Failed to send email to {user.username}: {str(e)}")
        
        return f"Sent reminder emails to applicable users"