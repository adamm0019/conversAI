const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function setupFirestore() {
  try {
    const userProfilesRef = db.collection('user_profiles');


    const now = new Date();

    await userProfilesRef.doc('system').set({
      user_id: 'system',
      email: 'system@example.com',
      firstName: 'System',
      lastName: 'User',
      displayName: 'System User',
      subscriptionTier: 'free',
      joinedAt: admin.firestore.FieldValue.serverTimestamp(),
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      preferences: {
        theme: 'dark',
        notifications: true,
        speechRecognition: true,
        aiVoice: 'alloy',
        dailyGoal: 15
      },
      dynamicVariables: {
        user_name: 'System',
        subscription_tier: 'free',
        language_level: 'beginner',
        target_language: 'Spanish',
        days_streak: 0,
        vocabulary_mastered: 0,
        grammar_mastered: 0,
        total_progress: 0
      },
      targetLanguages: [
        {
          language: 'Spanish',
          level: 'beginner',
          progress: 0,
          lastPracticed: now,
          streak: 0,
          vocabulary: {
            learned: 0,
            mastered: 0,
            totalAvailable: 1000
          },
          grammar: {
            learned: 0,
            mastered: 0,
            totalAvailable: 50
          }
        }
      ]
    });


    const chatsRef = db.collection('chats');
    const chatDoc = await chatsRef.add({
      title: 'Welcome Chat',
      subtitle: 'Getting started with language learning',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
      unread: 0,
      is_archived: false,
      user_id: 'system',
      last_message: 'Welcome to ConversAI!',
      language: 'Spanish',
      language_level: 'beginner',
      ai_model: 'default'
    });


    const messagesRef = db.collection('messages');
    await messagesRef.add({
      chat_id: chatDoc.id,
      content: 'Welcome to ConversAI!',
      role: 'assistant',
      created_at: admin.firestore.FieldValue.serverTimestamp(),
      formatted: {
        text: 'Welcome to ConversAI!',
        transcript: 'Welcome to ConversAI!'
      }
    });


  } catch (error) {
    console.error('Error setting up Firestore:', error);
  }
}

setupFirestore()
  .then(() => {
    process.exit(0);
  })
  .catch(err => {
    process.exit(1);
  });