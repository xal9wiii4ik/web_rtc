# web_rtc
This is django project with chat in back side using django channels and webrtc on front side.

This project has docker-compose file, you can clone this project and write docker-compose up on terminal
P.S. If you want to use chet with camera you need up project with out docker or configure sll sertificate on the server then write docker-compose up
(getUserMedia only works on https or in http://127.0.0.1:8000; write python manage.py runserver and un commit all commits in staticfiles/index.js)

# Main libraries:
1) Django-rest-framework
2) Django-channels
3) daphne(in docker)
4) gunicorn(in docker)
