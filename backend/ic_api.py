import aiohttp
from ic_parent_api import infinitecampus
from models import LoginRequest

async def authenticate_ic(creds: LoginRequest):
    """
    Authenticates with Infinite Campus and returns the IC client object if successful.
    """
    try:
        ic = infinitecampus.InfiniteCampus(
            base_url=creds.base_url,
            username=creds.username,
            secret=creds.password,
            district=creds.district
        )
        async with aiohttp.ClientSession() as session:
            auth_success = await ic.authenticate(session)
            if auth_success:
                return ic
            else:
                return None
    except Exception as e:
        print(f"Error authenticating: {e}")
        return None

async def get_students(ic_client):
    async with aiohttp.ClientSession() as session:
        await ic_client.authenticate(session)
        students = await ic_client.students()
        return students

async def get_courses_for_student(ic_client, student_id):
    async with aiohttp.ClientSession() as session:
        await ic_client.authenticate(session)
        courses = await ic_client.courses(student_id)
        return courses

async def get_assignments_for_student(ic_client, student_id):
    async with aiohttp.ClientSession() as session:
        await ic_client.authenticate(session)
        assignments = await ic_client.assignments(student_id)
        return assignments
