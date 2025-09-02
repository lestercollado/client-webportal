@echo off
CALL backend\venv\Scripts\activate
python backend\manage.py migrate
python backend\manage.py shell -c "import set_admin_password"
deactivate
