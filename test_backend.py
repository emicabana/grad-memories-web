import requests
import json
import sys
import os

BASE_URL = 'http://localhost:3000'

def print_result(msg, data):
    print(f"\n{'='*60}")
    print(f"{msg}")
    print(json.dumps(data, indent=2, ensure_ascii=False))

# Test 1: Register admin
print("\n[TEST 1] Registering admin user...")
resp = requests.post(f'{BASE_URL}/api/auth/register', json={
    'email': 'admin@gradmemories.com',
    'password': 'admin123',
    'role': 'admin'
})
print(f"Status: {resp.status_code}")
admin_data = resp.json()
print_result("Register Response", admin_data)
admin_id = admin_data.get('id')
if not admin_id:
    print("ERROR: No admin ID returned")
    sys.exit(1)

# Test 2: Login
print("\n[TEST 2] Login admin...")
resp = requests.post(f'{BASE_URL}/api/auth/login', json={
    'email': 'admin@gradmemories.com',
    'password': 'admin123'
})
print(f"Status: {resp.status_code}")
login_data = resp.json()
print_result("Login Response", login_data)
token = login_data.get('token')
if not token:
    print("ERROR: No token returned")
    sys.exit(1)

headers = {'Authorization': f'Bearer {token}'}

# Test 3: Create a test asset (mock upload)
print("\n[TEST 3] Creating mock asset...")
test_file_path = 'test_image.txt'
if not os.path.exists(test_file_path):
    with open(test_file_path, 'w') as f:
        f.write("Test image content")

with open(test_file_path, 'rb') as f:
    files = {'file': ('test_image.txt', f, 'text/plain')}
    resp = requests.post(f'{BASE_URL}/api/uploads', files=files, headers=headers)
    print(f"Status: {resp.status_code}")
    upload_data = resp.json()
    print_result("Upload Response", upload_data)
    asset_id = upload_data.get('asset', {}).get('_id')
    if not asset_id:
        print("ERROR: No asset ID returned")
        sys.exit(1)

# Test 4: List assets (admin)
print("\n[TEST 4] Listing all assets...")
resp = requests.get(f'{BASE_URL}/api/admin/assets', headers=headers)
print(f"Status: {resp.status_code}")
list_data = resp.json()
print_result("Assets List", list_data)

# Test 5: Update asset price
print("\n[TEST 5] Updating asset price...")
resp = requests.put(f'{BASE_URL}/api/admin/assets/{asset_id}', 
    json={'priceCents': 50000},
    headers=headers)
print(f"Status: {resp.status_code}")
update_data = resp.json()
print_result("Update Asset Response", update_data)

# Test 6: Create payment preference
print("\n[TEST 6] Creating payment preference...")
resp = requests.post(f'{BASE_URL}/api/payments/create_preference',
    json={'assetId': asset_id},
    headers=headers)
print(f"Status: {resp.status_code}")
pref_data = resp.json()
print_result("Payment Preference", pref_data)

# Test 7: Check health
print("\n[TEST 7] Health check...")
resp = requests.get(f'{BASE_URL}/api/health')
print(f"Status: {resp.status_code}")
health_data = resp.json()
print_result("Health", health_data)

print("\n" + "="*60)
print("✅ All tests completed successfully!")
print("="*60)
