#!/usr/bin/env python3

import os
import sys
from datetime import datetime
from pymongo import MongoClient
from pymongo.errors import ServerSelectionTimeoutError, ConfigurationError, OperationFailure

def test_mongodb_comprehensive():
    print("🧪 COMPREHENSIVE MONGODB TEST")
    print("=" * 50)
    
    # Your existing connection string
    uri = "mongodb://root:pA(5k*rW)z!3Tqe@UFj6R21Uq.mongodb.bj.baidubce.com:27017/admin"
    
    # Database for the translation platform
    db_name = os.getenv('MONGODB_DB_NAME', 'translation_platform')
    
    print(f"🔗 Connecting to MongoDB...")
    print(f"🗄️  Target Database: {db_name}")
    print("-" * 30)
    
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    
    try:
        # Test 1: Basic connection
        print("1️⃣ Testing basic connection...")
        client.admin.command("ping")
        print("✅ Basic connection: SUCCESS")
        
        # Test 2: Server info
        print("\n2️⃣ Getting server information...")
        server_info = client.admin.command('ismaster')
        server_status = client.admin.command('serverStatus')
        
        print(f"✅ MongoDB Version: {server_status.get('version', 'unknown')}")
        print(f"✅ Server Uptime: {server_status.get('uptime', 0)} seconds")
        print(f"✅ Current Connections: {server_status.get('connections', {}).get('current', 'unknown')}")
        print(f"✅ Available Connections: {server_status.get('connections', {}).get('available', 'unknown')}")
        
        # Test 3: Database access
        print(f"\n3️⃣ Testing database access: {db_name}")
        db = client[db_name]
        
        # List existing collections
        collections = db.list_collection_names()
        print(f"✅ Collections found: {len(collections)}")
        
        if collections:
            for i, collection in enumerate(collections[:10], 1):
                try:
                    count = db[collection].count_documents({})
                    print(f"   {i}. {collection}: {count} documents")
                except Exception as e:
                    print(f"   {i}. {collection}: Error counting - {str(e)}")
        else:
            print("   📝 No collections found (normal for new databases)")
        
        # Test 4: GridFS collections check
        print(f"\n4️⃣ Checking GridFS setup...")
        gridfs_files = "documents.files"
        gridfs_chunks = "documents.chunks"
        
        files_exists = gridfs_files in collections
        chunks_exists = gridfs_chunks in collections
        
        print(f"   📄 documents.files collection: {'EXISTS' if files_exists else 'NOT FOUND (will be created)'}")
        print(f"   🧩 documents.chunks collection: {'EXISTS' if chunks_exists else 'NOT FOUND (will be created)'}")
        
        if files_exists:
            files_count = db[gridfs_files].count_documents({})
            print(f"   📊 Files stored: {files_count}")
        
        if chunks_exists:
            chunks_count = db[gridfs_chunks].count_documents({})
            print(f"   📊 Chunks stored: {chunks_count}")
        
        # Test 5: Write operation
        print(f"\n5️⃣ Testing write operations...")
        test_collection = db['connection_test']
        test_doc = {
            'test': True,
            'timestamp': datetime.now(),
            'message': 'Node.js connection test',
            'platform': 'translation_platform'
        }
        
        result = test_collection.insert_one(test_doc)
        print(f"✅ Test document inserted with ID: {result.inserted_id}")
        
        # Test read operation
        retrieved = test_collection.find_one({'_id': result.inserted_id})
        if retrieved:
            print(f"✅ Test document retrieved successfully")
        
        # Clean up
        test_collection.delete_one({'_id': result.inserted_id})
        print("🧹 Test document cleaned up")
        
        # Test 6: File metadata simulation
        print(f"\n6️⃣ Testing file metadata operations...")
        metadata_collection = db['file_metadata_test']
        
        sample_metadata = {
            'user_id': 'test-user-123',
            'original_filename': 'test-document.pdf',
            'file_type': 'application/pdf',
            'file_size': 1024000,
            'gridfs_file_id': 'sample-gridfs-id',
            'created_at': datetime.now(),
            'upload_status': 'completed'
        }
        
        meta_result = metadata_collection.insert_one(sample_metadata)
        print(f"✅ File metadata test document inserted: {meta_result.inserted_id}")
        
        # Query test
        found_meta = metadata_collection.find_one({'user_id': 'test-user-123'})
        if found_meta:
            print(f"✅ Metadata query successful: {found_meta['original_filename']}")
        
        # Clean up metadata test
        metadata_collection.delete_one({'_id': meta_result.inserted_id})
        print("🧹 Metadata test document cleaned up")
        
        # Test 7: Index creation test
        print(f"\n7️⃣ Testing index operations...")
        try:
            # Create a test index
            metadata_collection.create_index([('user_id', 1), ('created_at', -1)])
            print("✅ Index creation: SUCCESS")
            
            # List indexes
            indexes = list(metadata_collection.list_indexes())
            print(f"✅ Indexes found: {len(indexes)}")
            
        except Exception as e:
            print(f"⚠️ Index test failed: {str(e)}")
        
        client.close()
        
        print("\n" + "🎉" * 20)
        print("✅ COMPREHENSIVE MONGODB TEST: SUCCESS")
        print("🎉" * 20)
        print("\n🚀 Your MongoDB is ready for the Node.js application!")
        print(f"📋 Use this in your .env file:")
        print(f"MONGODB_CONNECTION_STRING={uri}")
        print(f"MONGODB_DB_NAME={db_name}")
        
        return True
        
    except ServerSelectionTimeoutError as e:
        print(f"❌ Connection timeout: {str(e)}")
        print("🔍 Check your network and server availability")
        return False
        
    except ConfigurationError as e:
        print(f"❌ Configuration error: {str(e)}")
        print("🔍 Check your connection string format")
        return False
        
    except OperationFailure as e:
        print(f"❌ Operation failed: {str(e)}")
        print("🔍 Check your authentication and permissions")
        return False
        
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        print(f"🔍 Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = test_mongodb_comprehensive()
    
    if success:
        print("\n✅ MongoDB is ready! You can now run:")
        print("cd backend/services/api-gateway")
        print("npm run dev")
    else:
        print("\n❌ MongoDB test failed. Please fix the issues above.")
        sys.exit(1)