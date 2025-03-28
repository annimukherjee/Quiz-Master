# Quiz_Master_23f1003186


### Users:

- Admin
- Students


### Admin:

- Should be able to view all the Students / Users
- Should be able to create a new subject
- Should be able to create various chapters in a Subject
- Should be able to add quiz questions under a chapter.


```
Subject1:
    Chapter1:
        Quiz1
            q1
            q2
            q3
        Quiz2
            q1
            q2
            q3
        Quiz3
            q1
            q2
            q3 
Subject2:
    Chapter1:
        Quiz1
            q1
            q2
            q3
    Chapter2:
        Quiz1:
            q1
            q2
            q3
        Quiz2
            q1
            q2
            q3    
```

The admin account must pre-exist in the database when the application is initialized.

### User:
  
- Register a User and Login a User
- id, username (email), password, full_name, qualification, dob
- Should be able to choose Subject / Chapter name
- Start the quiz
- View the quiz scores


### DB Models (important ones)

#### Subject

- The field of study in which the user wishes to give the quiz.
- Created by Admin

```
id - primary key
Name
Description
etc: Additional fields (if any)
```

#### Chapter

- Each subject can be subdivided into multiple modules called chapters.

```
id - primary key
Name
Description
etc: Additional fields (if any)
```

#### Quiz

A test that is used to evaluate the user’s understanding of any particular chapter of any particular subject.

```
id - primary key
chapter_id (foreign key-chapter)
date_of_quiz
time_duration(hh:mm)
remarks (if any)
etc: Additional fields (if any)
```

#### Question

Every quiz will have a set of questions created by the admin.

```
id - primary key
quiz_id (foreign key-quiz)
question_statement
option1
option2
etc: Additional fields (if any)
```

#### Scores

Stores the scores and details of a user's quiz attempt.

```
id - primary key
quiz_id (foreign key-quiz) [cannot be unique]
user_id (foreign key-user) [cannot be unique]
time_stamp_of_attempt
total_scored
etc: Additional fields (if any)
```


### Wireframe

<img src="https://github.com/user-attachments/assets/b4e35be0-1716-4149-8421-22ea8407b6ba" width="80%">



## Core Requirements

### Admin login and User login

- A login/register form with fields like username, password etc. for user and admin login
- The application should have only one admin identified by its role
- Use Flask security (session or token) based authentication to implement role-based access control
- The app must have a suitable model to store and differentiate all types of users


### Admin Dashboard - for the Admin
- The admin should be added, whenever a new database is created
- The admin creates/edits/deletes a subject
- The admin creates/edits/deletes a chapter under the subject
- The admin will create a new quiz under a chapter
- Each quiz contains a set of questions  (MCQ - only one option correct)
- The admin can search the users/subjects/quizzes
- Shows the summary charts


### Quiz management - for the Admin
- Edit/delete a quiz
- The admin specifies the date and duration(HH: MM) of the quiz
- The admin creates/edits/deletes the MCQ (only one option correct) questions inside the specific quiz


### User dashboard - for the User
- The user can attempt any quiz of his/her interest
- Every quiz has a timer
- Each quiz score is recorded
- The earlier quiz attempts are shown
- To be able to see the summary charts
- 
Note: The database must be created programmatically (via table creation or model code). Manual database creation, such as using DB Browser for SQLite, is NOT allowed.


### Backend Jobs


#### a. Scheduled Job - Daily reminders -

 The application should send daily reminders to users on mail


  - Check if a user has not visited or a new quiz is created by the admin
  - If yes, then send the alert asking them to visit and attempt the quiz if it is relevant to them
  - The reminder can be sent in the evening, every day (students can choose the time)


#### b. Scheduled Job - Monthly Activity Report
Devise a monthly report for the user created using HTML and sent via mail.


- The activity report can include quiz details, how many quizzes taken in a month, their score, average score, ranking in the quiz etc.
- For the monthly report to be sent
  - start a job on the first day of every month → create a report using the above parameters → send it as an email


#### c.1 User Triggered Async Job - Export as CSV

Devise a CSV format details for the quizzes completed by the user

This export is meant to download the quiz details (quiz_id, chapter_id,  date_of_quiz, score, remarks etc.)

Have a dashboard from where the user can trigger the export
This should trigger a batch job, and send an alert once done

OR

#### c.2 User Triggered Async Job - Export as CSV

- Devise a CSV format details for the all quizzes to be seen by the admin
- This export is meant to download the user details (user_id, quizzes_taken, average score (performance), etc.)
- Have a dashboard from where the admin can trigger the export
- This should trigger a batch job, and send an alert once done


### Performance and Caching
- Add caching where required to increase the performance (only for a couple of endpoints)
- Add cache expiry
- API Performance


### Recommended Functionalities
- Well-designed PDF reports for Monthly activity reports (Students can choose between HTML and PDF reports)
- External APIs/libraries for creating charts, e.g. ChartJS
- Implementing frontend validation on all the form fields using HTML5 form validation or JavaScript
- Implementing backend validation within your APIs


### Optional Functionalities
- Provide styling and aesthetics to your application by creating a beautiful front end using simple CSS or Bootstrap
- Implement a dummy payment portal (just a view taking payment details from user for paid quizzes)


