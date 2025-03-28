from flask import Blueprint, request, jsonify
from backend.models.models import User, Subject, Chapter, Quiz, Question, Score
# from backend.models.models import User
from datetime import datetime

user_bp = Blueprint('user', __name__)

# Get all subjects
@user_bp.route('/subjects', methods=['GET'])
def get_subjects():
    subjects = Subject.query.all()
    return jsonify([{
        'id': subject.id,
        'name': subject.name,
        'description': subject.description
    } for subject in subjects]), 200

# Get chapters for a subject
@user_bp.route('/subjects/<int:subject_id>/chapters', methods=['GET'])
def get_chapters(subject_id):
    chapters = Chapter.query.filter_by(subject_id=subject_id).all()
    return jsonify([{
        'id': chapter.id,
        'name': chapter.name,
        'description': chapter.description,
        'subject_id': chapter.subject_id
    } for chapter in chapters]), 200

# Get quizzes for a chapter
@user_bp.route('/chapters/<int:chapter_id>/quizzes', methods=['GET'])
def get_quizzes(chapter_id):
    quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
    return jsonify([{
        'id': quiz.id,
        'title': quiz.title,
        'chapter_id': quiz.chapter_id,
        'date_of_quiz': quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
        'time_duration': quiz.time_duration,
        'remarks': quiz.remarks
    } for quiz in quizzes]), 200

# Get a specific quiz
@user_bp.route('/quizzes/<int:quiz_id>', methods=['GET'])
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Get questions without correct answer
    questions = [{
        'id': q.id,
        'question': q.question,
        'options': {
            'a': q.option_a,
            'b': q.option_b,
            'c': q.option_c,
            'd': q.option_d
        }
    } for q in quiz.questions]
    
    return jsonify({
        'id': quiz.id,
        'title': quiz.title,
        'chapter_id': quiz.chapter_id,
        'date_of_quiz': quiz.date_of_quiz.strftime('%Y-%m-%d') if quiz.date_of_quiz else None,
        'time_duration': quiz.time_duration,
        'remarks': quiz.remarks,
        'questions': questions
    }), 200

# Submit a quiz
@user_bp.route('/quizzes/<int:quiz_id>/submit', methods=['POST'])
def submit_quiz(quiz_id):
    current_user_id = get_jwt_identity().get('id')
    data = request.get_json()
    
    # Validate quiz
    quiz = Quiz.query.get_or_404(quiz_id)
    
    # Get correct answers
    questions = {q.id: q.correct_option for q in quiz.questions}
    
    # Calculate score
    total_questions = len(questions)
    correct_answers = 0
    
    for answer in data.get('answers', []):
        question_id = answer.get('question_id')
        selected_option = answer.get('selected_option')
        
        if question_id in questions and questions[question_id] == selected_option:
            correct_answers += 1
    
    # Create score record
    score = Score(
        user_id=current_user_id,
        quiz_id=quiz_id,
        score=correct_answers,
        total_questions=total_questions,
        time_taken=data.get('time_taken'),
        attempt_date=datetime.utcnow()
    )
    
    db.session.add(score)
    db.session.commit()
    
    return jsonify({
        'score': correct_answers,
        'total_questions': total_questions,
        'percentage': round((correct_answers / total_questions) * 100, 2) if total_questions > 0 else 0
    }), 200

# Get user's quiz history
@user_bp.route('/my-scores', methods=['GET'])
def get_my_scores():
    current_user_id = get_jwt_identity().get('id')
    
    scores = Score.query.filter_by(user_id=current_user_id).all()
    result = []
    
    for score in scores:
        quiz = Quiz.query.get(score.quiz_id)
        chapter = Chapter.query.get(quiz.chapter_id)
        subject = Subject.query.get(chapter.subject_id)
        
        result.append({
            'id': score.id,
            'quiz_id': score.quiz_id,
            'quiz_title': quiz.title,
            'chapter_name': chapter.name,
            'subject_name': subject.name,
            'score': score.score,
            'total_questions': score.total_questions,
            'percentage': round((score.score / score.total_questions) * 100, 2) if score.total_questions > 0 else 0,
            'time_taken': score.time_taken,
            'attempt_date': score.attempt_date.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return jsonify(result), 200