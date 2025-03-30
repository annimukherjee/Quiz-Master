import os
import csv
from celery_app import celery_app
from app import create_app
from app.models import User, Quiz, Score, Chapter, Subject, ExportRequest
from app.extensions import db
from datetime import datetime

@celery_app.task
def generate_user_quiz_history_csv(user_id, export_id):
    """Generate CSV export of user's quiz history."""
    app = create_app()
    with app.app_context():
        # Get user info
        user = User.query.get(user_id)
        export_request = ExportRequest.query.get(export_id)
        
        if not user or not export_request:
            return {'status': 'error', 'message': 'User or export request not found'}
            
        # Get all scores for this user
        scores = Score.query.filter_by(user_id=user_id).all()
        
        if not scores:
            export_request.status = 'failed'
            db.session.commit()
            return {'status': 'error', 'message': 'No quiz history found for this user'}
            
        # Create a unique filename
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        filename = f"quiz_history_{user.username}_{timestamp}.csv"
        
        # Create exports directory if it doesn't exist
        exports_dir = os.path.join(app.static_folder, 'exports')
        os.makedirs(exports_dir, exist_ok=True)
        file_path = os.path.join(exports_dir, filename)
        
        # Prepare data for CSV
        data = []
        for score in scores:
            quiz = Quiz.query.get(score.quiz_id)
            chapter = Chapter.query.get(quiz.chapter_id)
            subject = Subject.query.get(chapter.subject_id)
            
            data.append({
                'Date': score.time_stamp_of_attempt.strftime('%Y-%m-%d %H:%M:%S'),
                'Subject': subject.name,
                'Chapter': chapter.name,
                'Quiz Date': quiz.date_of_quiz.strftime('%Y-%m-%d'),
                'Score': score.total_scored,
                'Total Questions': score.max_score,
                'Percentage': f"{(score.total_scored / score.max_score * 100):.2f}%"
            })
            
        # Write CSV file
        with open(file_path, 'w', newline='') as csvfile:
            fieldnames = ['Date', 'Subject', 'Chapter', 'Quiz Date', 'Score', 'Total Questions', 'Percentage']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            writer.writeheader()
            for row in data:
                writer.writerow(row)
                
        # Update export request status
        export_request.status = 'completed'
        export_request.file_name = filename
        export_request.completed_at = datetime.utcnow()
        db.session.commit()
        
        # Return success with file info
        return {
            'status': 'success',
            'file_path': file_path,
            'filename': filename,
            'export_id': export_id,
            'count': len(data)
        }
