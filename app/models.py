# app/models.py
from app import db, login_manager
from flask_login import UserMixin
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime
import enum

# Define role enum
class Role(enum.Enum):
    USER = 'user'
    ADMIN = 'admin'

class User(db.Model, UserMixin):

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(120), unique=True, nullable=False)  # Email
    password_hash = db.Column(db.String(128), nullable=False)
    full_name = db.Column(db.String(100), nullable=False)
    qualification = db.Column(db.String(100), nullable=True)
    dob = db.Column(db.Date, nullable=True)
    role = db.Column(db.Enum(Role), default=Role.USER, nullable=False)
    scores = db.relationship('Score', backref='user', lazy=True)
    
    def set_password(self, password):
        self.password_hash = generate_password_hash(password)
        
    def check_password(self, password):
        return check_password_hash(self.password_hash, password)
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'full_name': self.full_name,
            'qualification': self.qualification,
            'dob': self.dob.isoformat() if self.dob else None,
            'role': self.role.value
        }




class Subject(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    chapters = db.relationship('Chapter', backref='subject', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description
        }




class Chapter(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=True)
    subject_id = db.Column(db.Integer, db.ForeignKey('subject.id'), nullable=False)
    quizzes = db.relationship('Quiz', backref='chapter', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'subject_id': self.subject_id
        }





class Quiz(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    chapter_id = db.Column(db.Integer, db.ForeignKey('chapter.id'), nullable=False)
    date_of_quiz = db.Column(db.Date, nullable=False)
    time_duration = db.Column(db.String(5), nullable=False)  # Format: HH:MM
    remarks = db.Column(db.Text, nullable=True)
    questions = db.relationship('Question', backref='quiz', lazy=True)
    scores = db.relationship('Score', backref='quiz', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'chapter_id': self.chapter_id,
            'date_of_quiz': self.date_of_quiz.isoformat(),
            'time_duration': self.time_duration,
            'remarks': self.remarks
        }




class Question(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    question_statement = db.Column(db.Text, nullable=False)
    option1 = db.Column(db.String(255), nullable=False)
    option2 = db.Column(db.String(255), nullable=False)
    option3 = db.Column(db.String(255), nullable=False)
    option4 = db.Column(db.String(255), nullable=False)
    correct_option = db.Column(db.Integer, nullable=False)  # 1-4 for options 1-4
    
    def to_dict(self, include_correct=False):
        result = {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'question_statement': self.question_statement,
            'options': [
                self.option1,
                self.option2,
                self.option3,
                self.option4
            ]
        }
        if include_correct:
            result['correct_option'] = self.correct_option
        return result





class Score(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    quiz_id = db.Column(db.Integer, db.ForeignKey('quiz.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    time_stamp_of_attempt = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    total_scored = db.Column(db.Integer, nullable=False)
    max_score = db.Column(db.Integer, nullable=False)
    
    def to_dict(self):
        return {
            'id': self.id,
            'quiz_id': self.quiz_id,
            'user_id': self.user_id,
            'time_stamp_of_attempt': self.time_stamp_of_attempt.isoformat(),
            'total_scored': self.total_scored,
            'max_score': self.max_score
        }

    




@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


