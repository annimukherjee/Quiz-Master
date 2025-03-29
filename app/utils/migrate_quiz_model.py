def migrate_quizzes():
    app = create_app()
    with app.app_context():
        # Check if the column exists
        inspector = db.inspect(db.engine)
        columns = [col['name'] for col in inspector.get_columns('quiz')]

        if 'end_date' not in columns:
            print("Adding end_date column to Quiz table...")

            # Use a connection to execute raw SQL
            with db.engine.connect() as connection:
                connection.execute(db.text('ALTER TABLE quiz ADD COLUMN end_date DATE;'))

            # Update existing quizzes
            quizzes = Quiz.query.all()
            for quiz in quizzes:
                if quiz.date_of_quiz:
                    quiz.end_date = quiz.date_of_quiz + timedelta(days=7)

            db.session.commit()
            print(f"Updated {len(quizzes)} existing quizzes with default end dates.")
        else:
            print("end_date column already exists in Quiz table.")