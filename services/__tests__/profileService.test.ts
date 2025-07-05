import { getUserProfileData } from '../profileService';
import { doc, onSnapshot, getFirestore } from 'firebase/firestore';

// Mock Firebase Firestore functions
jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(),
  doc: jest.fn(),
  onSnapshot: jest.fn(),
}));

describe('profileService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  it('should call onSnapshot with the correct user ID and callback', () => {
    const mockUserId = 'testUserId';
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();

    // Mock the return value of getFirestore and doc
    (getFirestore as jest.Mock).mockReturnValue({});
    (doc as jest.Mock).mockReturnValue({});

    getUserProfileData(mockUserId, mockCallback, mockErrorCallback);

    expect(getFirestore).toHaveBeenCalledTimes(1);
    expect(doc).toHaveBeenCalledWith({}, 'userProfiles', mockUserId);
    expect(onSnapshot).toHaveBeenCalledTimes(1);
    expect(onSnapshot).toHaveBeenCalledWith({}, expect.any(Function), expect.any(Function));
  });

  it('should call the callback with profile data when snapshot changes', () => {
    const mockUserId = 'testUserId';
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const mockProfileData = { name: 'Test User', theme: 'dark' };

    // Mock onSnapshot to immediately call the success callback
    (onSnapshot as jest.Mock).mockImplementation((_docRef, successCallback) => {
      successCallback({ exists: () => true, data: () => mockProfileData });
      return jest.fn(); // Return an unsubscribe function
    });

    getUserProfileData(mockUserId, mockCallback, mockErrorCallback);

    expect(mockCallback).toHaveBeenCalledWith(mockProfileData);
    expect(mockErrorCallback).not.toHaveBeenCalled();
  });

  it('should call the error callback when snapshot encounters an error', () => {
    const mockUserId = 'testUserId';
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const mockError = new Error('Test error');

    // Mock onSnapshot to immediately call the error callback
    (onSnapshot as jest.Mock).mockImplementation((_docRef, _successCallback, errorCallback) => {
      errorCallback(mockError);
      return jest.fn(); // Return an unsubscribe function
    });

    getUserProfileData(mockUserId, mockCallback, mockErrorCallback);

    expect(mockCallback).not.toHaveBeenCalled();
    expect(mockErrorCallback).toHaveBeenCalledWith(mockError);
  });

  it('should return an unsubscribe function', () => {
    const mockUserId = 'testUserId';
    const mockCallback = jest.fn();
    const mockErrorCallback = jest.fn();
    const mockUnsubscribe = jest.fn();

    (onSnapshot as jest.Mock).mockReturnValue(mockUnsubscribe);

    const unsubscribe = getUserProfileData(mockUserId, mockCallback, mockErrorCallback);

    expect(unsubscribe).toBe(mockUnsubscribe);
  });
});
