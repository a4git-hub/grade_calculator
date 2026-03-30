import asyncio
from models import LoginRequest
import ic_api

async def test_ic():
    # Replace these with real credentials to test locally
    base_url = input("Enter IC Base URL (e.g. https://campus.district.org): ")
    district = input("Enter District: ")
    username = input("Enter Username: ")
    import getpass
    password = getpass.getpass("Enter Password: ")
    
    creds = LoginRequest(
        base_url=base_url,
        district=district,
        username=username,
        password=password
    )
    
    print("Authenticating...")
    ic_client = await ic_api.authenticate_ic(creds)
    if not ic_client:
        print("Login failed.")
        return
        
    print("Login successful! Fetching students...")
    students = await ic_api.get_students(ic_client)
    print(f"Students: {students}")
    
    if students:
        first_student_id = students[0].get('personID')
        print(f"Fetching courses for student {first_student_id}...")
        courses = await ic_api.get_courses_for_student(ic_client, first_student_id)
        print(f"Found {len(courses)} courses.")
        for course in courses:
             print(f"- {course.get('courseName')} (ID: {course.get('courseID')})")

if __name__ == "__main__":
    asyncio.run(test_ic())
