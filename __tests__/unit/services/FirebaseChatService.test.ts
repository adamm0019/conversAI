import '@testing-library/jest-dom';
import '../../../src/setupTests';

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn().mockResolvedValue({ exists: () => true, data: () => ({ test: 'data' }) }),
  setDoc: jest.fn().mockResolvedValue(undefined),
  updateDoc: jest.fn().mockResolvedValue(undefined),
  serverTimestamp: jest.fn()
}));

import { useFirebaseChatService } from '../../../src/services/FirebaseChatService';

describe('FirebaseChatService', () => {
  it('should initialize and expose methods', () => {
    const service = useFirebaseChatService();
    expect(service).toHaveProperty('isFirebaseInitialized');
  });
}); 