import asyncio
from models import LoginRequest
import ic_api

async def test():
    req = LoginRequest(
        base_url='https://srvusd.infinitecampus.org/campus/',
        district='sanRamon',
        username='235038',
        password='fake_password'
    )
    ic_client = await ic_api.authenticate_ic(req)
    try:
        students = await ic_api.get_students(ic_client)
        print("Students:", students)
    except Exception as e:
        import traceback
        traceback.print_exc()

asyncio.run(test())
