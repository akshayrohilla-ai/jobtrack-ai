import os
from dotenv import load_dotenv
load_dotenv()

print("SUPABASE_URL:", os.getenv("SUPABASE_URL"))
print("KEY starts with:", os.getenv("SUPABASE_SERVICE_KEY", "")[:20])

from supabase import create_client
try:
    client = create_client(os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY"))
    result = client.table("applications").select("count").execute()
    print("SUCCESS:", result)
except Exception as e:
    print("ERROR:", type(e).__name__, str(e))
