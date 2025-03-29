# app/api/admin.py
from flask import request, jsonify
from flask_login import login_required, current_user
from app.models import User, Role, Subject, Chapter, Quiz, Question
from app import db
from app.api import api_bp
from datetime import datetime

# Admin middleware
def admin_required(f):
    @login_required
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != Role.ADMIN:
            return jsonify({'message': 'Admin access required'}), 403
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# User management
@api_bp.route('/admin/users', methods=['GET'])
@admin_required
def get_users():
    users = User.query.all()
    return jsonify({
        'users': [user.to_dict() for user in users]
    })



# Subject management
@api_bp.route('/admin/subjects', methods=['GET'])
@admin_required
def get_subjects():
    subjects = Subject.query.all()
    return jsonify({
        'subjects': [subject.to_dict() for subject in subjects]
    })



@api_bp.route('/admin/subjects', methods=['POST'])
@admin_required
def create_subject():

    data = request.get_json()

    new_subject = Subject(
        name=data.get('name'),
        description=data.get('description')
    )

    db.session.add(new_subject)
    db.session.commit()
    return jsonify({
        'message': 'Subject created successfully',
        'subject': new_subject.to_dict()
    }), 201


@api_bp.route('/admin/subjects/<int:subject_id>', methods=['PUT'])
@admin_required
def update_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    data = request.get_json()
    
    subject.name = data.get('name', subject.name)
    subject.description = data.get('description', subject.description)
    
    db.session.commit()
    return jsonify({
        'message': 'Subject updated successfully',
        'subject': subject.to_dict()
    })


@api_bp.route('/admin/subjects/<int:subject_id>', methods=['DELETE'])
@admin_required
def delete_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    db.session.delete(subject)
    db.session.commit()
    return jsonify({
        'message': 'Subject deleted successfully'
    })




# Chapter management
@api_bp.route('/admin/chapters', methods=['GET'])
@admin_required
def get_chapters():
    subject_id = request.args.get('subject_id', type=int)

    print(subject_id)
    if subject_id:
        chapters = Chapter.query.filter_by(subject_id=subject_id).all()
    else:
        chapters = Chapter.query.all()
    return jsonify({
        'chapters': [chapter.to_dict() for chapter in chapters]
    })

@api_bp.route('/admin/chapters', methods=['POST'])
@admin_required
def create_chapter():
    data = request.get_json()
    
    new_chapter = Chapter(
        name=data.get('name'),
        description=data.get('description'),
        subject_id=data.get('subject_id')
    )

    db.session.add(new_chapter)
    db.session.commit()
    return jsonify({
        'message': 'Chapter created successfully',
        'chapter': new_chapter.to_dict()
    }), 201

@api_bp.route('/admin/chapters/<int:chapter_id>', methods=['PUT'])
@admin_required
def update_chapter(chapter_id):
    chapter = Chapter.query.get_or_404(chapter_id)
    data = request.get_json()
    
    chapter.name = data.get('name', chapter.name)
    chapter.description = data.get('description', chapter.description)
    chapter.subject_id = data.get('subject_id', chapter.subject_id)
    
    db.session.commit()
    return jsonify({
        'message': 'Chapter updated successfully',
        'chapter': chapter.to_dict()
    })

@api_bp.route('/admin/chapters/<int:chapter_id>', methods=['DELETE'])
@admin_required
def delete_chapter(chapter_id):
    chapter = Chapter.query.get_or_404(chapter_id)
    db.session.delete(chapter)
    db.session.commit()
    return jsonify({
        'message': 'Chapter deleted successfully'
    })



# Quiz management
@api_bp.route('/admin/quizzes', methods=['GET'])
@admin_required
def get_quizzes():
    chapter_id = request.args.get('chapter_id', type=int)
    if chapter_id:
        quizzes = Quiz.query.filter_by(chapter_id=chapter_id).all()
    else:
        quizzes = Quiz.query.all()
    return jsonify({
        'quizzes': [quiz.to_dict() for quiz in quizzes]
    })

@api_bp.route('/admin/quizzes', methods=['POST'])
@admin_required
def create_quiz():
    data = request.get_json()
    
    try:
        date_of_quiz = datetime.strptime(data.get('date_of_quiz'), '%Y-%m-%d').date()
    except ValueError:
        return jsonify({'message': 'Invalid date format'}), 400
    
    new_quiz = Quiz(
        chapter_id=data.get('chapter_id'),
        date_of_quiz=date_of_quiz,
        time_duration=data.get('time_duration'),
        remarks=data.get('remarks')
    )
    db.session.add(new_quiz)
    db.session.commit()
    return jsonify({
        'message': 'Quiz created successfully',
        'quiz': new_quiz.to_dict()
    }), 201

@api_bp.route('/admin/quizzes/<int:quiz_id>', methods=['PUT'])
@admin_required
def update_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    data = request.get_json()
    
    if 'date_of_quiz' in data:
        try:
            quiz.date_of_quiz = datetime.strptime(data.get('date_of_quiz'), '%Y-%m-%d').date()
        except ValueError:
            return jsonify({'message': 'Invalid date format'}), 400
    
    quiz.chapter_id = data.get('chapter_id', quiz.chapter_id)
    quiz.time_duration = data.get('time_duration', quiz.time_duration)
    quiz.remarks = data.get('remarks', quiz.remarks)
    
    db.session.commit()
    return jsonify({
        'message': 'Quiz updated successfully',
        'quiz': quiz.to_dict()
    })

@api_bp.route('/admin/quizzes/<int:quiz_id>', methods=['DELETE'])
@admin_required
def delete_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    db.session.delete(quiz)
    db.session.commit()
    return jsonify({
        'message': 'Quiz deleted successfully'
    })

# Question management
@api_bp.route('/admin/questions', methods=['GET'])
@admin_required
def get_questions():
    quiz_id = request.args.get('quiz_id', type=int)
    if quiz_id:
        questions = Question.query.filter_by(quiz_id=quiz_id).all()
    else:
        questions = Question.query.all()
    return jsonify({
        'questions': [question.to_dict(include_correct=True) for question in questions]
    })

@api_bp.route('/admin/questions', methods=['POST'])
@admin_required
def create_question():
    data = request.get_json()
    
    new_question = Question(
        quiz_id=data.get('quiz_id'),
        question_statement=data.get('question_statement'),
        option1=data.get('options')[0],
        option2=data.get('options')[1],
        option3=data.get('options')[2],
        option4=data.get('options')[3],
        correct_option=data.get('correct_option')
    )
    db.session.add(new_question)
    db.session.commit()
    return jsonify({
        'message': 'Question created successfully',
        'question': new_question.to_dict(include_correct=True)
    }), 201

@api_bp.route('/admin/questions/<int:question_id>', methods=['PUT'])
@admin_required
def update_question(question_id):
    question = Question.query.get_or_404(question_id)
    data = request.get_json()
    
    question.quiz_id = data.get('quiz_id', question.quiz_id)
    question.question_statement = data.get('question_statement', question.question_statement)
    
    if 'options' in data:
        question.option1 = data['options'][0]
        question.option2 = data['options'][1]
        question.option3 = data['options'][2]
        question.option4 = data['options'][3]
    
    question.correct_option = data.get('correct_option', question.correct_option)
    
    db.session.commit()
    return jsonify({
        'message': 'Question updated successfully',
        'question': question.to_dict(include_correct=True)
    })

@api_bp.route('/admin/questions/<int:question_id>', methods=['DELETE'])
@admin_required
def delete_question(question_id):
    question = Question.query.get_or_404(question_id)
    db.session.delete(question)
    db.session.commit()
    return jsonify({
        'message': 'Question deleted successfully'
    })


# app/api/admin.py
# Add these routes to the admin.py file

@api_bp.route('/admin/subjects/<int:subject_id>', methods=['GET'])
@admin_required
def get_subject(subject_id):
    subject = Subject.query.get_or_404(subject_id)
    return jsonify({
        'subject': subject.to_dict()
    })

@api_bp.route('/admin/chapters/<int:chapter_id>', methods=['GET'])
@admin_required
def get_chapter(chapter_id):
    chapter = Chapter.query.get_or_404(chapter_id)
    return jsonify({
        'chapter': chapter.to_dict()
    })

@api_bp.route('/admin/quizzes/<int:quiz_id>', methods=['GET'])
@admin_required
def get_quiz(quiz_id):
    quiz = Quiz.query.get_or_404(quiz_id)
    return jsonify({
        'quiz': quiz.to_dict()
    })