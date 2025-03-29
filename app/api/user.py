# app/api/user.py
from flask import request, jsonify
from flask_login import login_required, current_user
from app.models import Subject, Chapter, Quiz, Question, Score
from app.extensions import db
from app.api import api_bp
from datetime import datetime

# User dashboard
@api_bp.route('/user/subjects', methods=['GET'])
@login_required
def get_user_subjects():
    subjects = Subject.query.all()
    return jsonify({
        'subjects': [subject.to_dict() for subject in subjects]
    })

@api_bp.route('/user/chapters', methods=['GET'])
@login_required
def get_user_chapters():
    subject_id = request.args.get('subject_id', type=int)
    if subject_id:
        chapters = Chapter.query.filter_by(subject_id=subject_id).all()
    else:
        chapters = Chapter.query.all()
    return jsonify({
        'chapters': [chapter.to_dict() for chapter in chapters]
    })

@api_bp.route('/user/quizzes', methods=['GET'])
@login_required
def get_user_quizzes():
    chapter_id = request.args.get('chapter_id', type=int)
    if chapter_id:
        quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
    else:
        quizzes = Quiz.query.all()
    return jsonify({
        'quizzes': [quiz.to_dict() for quiz in quizzes]
    })

@api_bp.route('/user/quiz/<int:quiz_id>', methods=['GET'])
@login_required
def get_quiz_details(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Check if the quiz is available
    now = datetime.now().date()
    if quiz.date_of_quiz > now:
        return jsonify({'message': 'This quiz is not yet available'}), 403
    
    if quiz.end_date and now > quiz.end_date:
        return jsonify({'message': 'This quiz has expired'}), 403
    
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    return jsonify({
        'quiz': quiz.to_dict(),
        'questions': [question.to_dict(include_correct=False) for question in questions]
    })

# Do the same for submit_quiz endpoint:
@api_bp.route('/user/quiz/<int:quiz_id>/submit', methods=['POST'])
@login_required
def submit_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Check if the quiz is available
    now = datetime.now().date()
    if quiz.date_of_quiz > now:
        return jsonify({'message': 'This quiz is not yet available'}), 403
    
    if quiz.end_date and now > quiz.end_date:
        return jsonify({'message': 'This quiz has expired and can no longer be submitted'}), 403


    data = request.get_json()
    answers = data.get('answers', {})
    
    # Get all questions for this quiz
    questions = Question.query.filter_by(quiz_id=quiz_id).all()
    
    # Calculate score
    total_questions = len(questions)
    correct_answers = 0
    
    for question in questions:
        question_id_str = str(question.id)
        if question_id_str in answers and answers[question_id_str] == question.correct_option:
            correct_answers += 1
    
    # Save score
    score = Score(
        quiz_id=quiz_id,
        user_id=current_user.id,
        time_stamp_of_attempt=datetime.utcnow(),
        total_scored=correct_answers,
        max_score=total_questions
    )
    
    db.session.add(score)
    db.session.commit()
    
    return jsonify({
        'message': 'Quiz submitted successfully',
        'score': score.to_dict()
    })

@api_bp.route('/user/scores', methods=['GET'])
@login_required
def get_user_scores():
    scores = Score.query.filter_by(user_id=current_user.id).all()
    
    result = []
    for score in scores:
        quiz = Quiz.query.get(score.quiz_id)
        chapter = Chapter.query.get(quiz.chapter_id)
        subject = Subject.query.get(chapter.subject_id)
        
        result.append({
            **score.to_dict(),
            'quiz': quiz.to_dict(),
            'chapter': chapter.to_dict(),
            'subject': subject.to_dict()
        })
    
    return jsonify({
        'scores': result
    })


# app/api/user.py
# Add these endpoints

@api_bp.route('/user/subjects/<int:subject_id>', methods=['GET'])
@login_required
def get_user_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    return jsonify({
        'subject': subject.to_dict()
    })

@api_bp.route('/user/chapters/<int:chapter_id>', methods=['GET'])
@login_required
def get_user_chapter(chapter_id):
    chapter = Chapter.query.get_or_404(chapter_id)
    return jsonify({
        'chapter': chapter.to_dict()
    })



@api_bp.route('/user/statistics', methods=['GET'])
@login_required
def get_user_statistics():
    user_id = current_user.id
    
    # Get total counts
    total_attempts = Score.query.filter_by(user_id=user_id).count()
    
    # Get scores
    user_scores = Score.query.filter_by(user_id=user_id).all()
    
    # Calculate average score and build score history
    avg_score = 0
    total_correct = 0
    total_questions = 0
    score_history = []
    
    for score in user_scores:
        total_correct += score.total_scored
        total_questions += score.max_score
        
        quiz = Quiz.query.get(score.quiz_id)
        chapter = Chapter.query.get(quiz.chapter_id)
        subject = Subject.query.get(chapter.subject_id)
        
        score_history.append({
            'timestamp': score.time_stamp_of_attempt.isoformat(),
            'quiz_date': quiz.date_of_quiz.isoformat(),
            'chapter_name': chapter.name,
            'subject_name': subject.name,
            'score': score.total_scored,
            'max_score': score.max_score,
            'percentage': round((score.total_scored / score.max_score) * 100, 2)
        })
    
    if total_questions > 0:
        avg_score = round((total_correct / total_questions) * 100, 2)
    
    # Get subject performance
    subject_performance = {}
    
    for score in user_scores:
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
    
    # Sort by attempts descending
    subject_stats.sort(key=lambda x: x['attempts'], reverse=True)
    
    return jsonify({
        'total_attempts': total_attempts,
        'average_score': avg_score,
        'total_correct': total_correct,
        'total_questions': total_questions,
        'score_history': score_history,
        'subject_stats': subject_stats
    })


