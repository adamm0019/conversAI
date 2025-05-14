import { renderHook, act } from '@testing-library/react';
import { useStreak } from '../../../src/hooks/useStreak';


const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value.toString();
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useStreak Hook', () => {
  beforeEach(() => {

    localStorageMock.clear();
    jest.clearAllMocks();
  });

  it('should initialize with default streak data when localStorage is empty', () => {

    const today = '2025-05-05';
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${today}T12:00:00.000Z`);

    const { result } = renderHook(() => useStreak());

    expect(result.current.streakData).toEqual({
      currentStreak: 0,
      lastInteractionDate: today,
      highestStreak: 0,
    });
  });

  it('should load streak data from localStorage if available', () => {
    const storedData = {
      currentStreak: 5,
      lastInteractionDate: '2025-05-04',
      highestStreak: 10,
    };
    localStorageMock.setItem('conversationStreak', JSON.stringify(storedData));

    const { result } = renderHook(() => useStreak());

    expect(result.current.streakData).toEqual(storedData);
  });

  it('should increment streak when updateStreak is called on a new day', () => {

    const initialData = {
      currentStreak: 3,
      lastInteractionDate: '2025-05-04',
      highestStreak: 5,
    };
    localStorageMock.setItem('conversationStreak', JSON.stringify(initialData));


    const today = '2025-05-05';
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${today}T12:00:00.000Z`);

    const { result } = renderHook(() => useStreak());


    act(() => {
      result.current.updateStreak();
    });


    expect(result.current.streakData).toEqual({
      currentStreak: 4,
      lastInteractionDate: today,
      highestStreak: 5,
    });
    expect(result.current.showNotification).toBe(true);
  });

  it('should not increment streak when updateStreak is called on the same day', () => {
    const today = '2023-05-15';

    const initialData = {
      currentStreak: 3,
      lastInteractionDate: today,
      highestStreak: 5,
    };
    localStorageMock.setItem('conversationStreak', JSON.stringify(initialData));


    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${today}T12:00:00.000Z`);

    const { result } = renderHook(() => useStreak());


    act(() => {
      result.current.updateStreak();
    });


    expect(result.current.streakData).toEqual(initialData);
  });

  it('should update highest streak when current streak exceeds it', () => {

    const initialData = {
      currentStreak: 5,
      lastInteractionDate: '2025-05-04',
      highestStreak: 5,
    };
    localStorageMock.setItem('conversationStreak', JSON.stringify(initialData));


    const today = '2025-05-05';
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${today}T12:00:00.000Z`);

    const { result } = renderHook(() => useStreak());


    act(() => {
      result.current.updateStreak();
    });


    expect(result.current.streakData).toEqual({
      currentStreak: 6,
      lastInteractionDate: today,
      highestStreak: 6,
    });
  });

  it('should reset streak when resetStreak is called', () => {

    const initialData = {
      currentStreak: 5,
      lastInteractionDate: '2025-05-04',
      highestStreak: 10,
    };
    localStorageMock.setItem('conversationStreak', JSON.stringify(initialData));


    const today = '2025-05-05';
    jest.spyOn(Date.prototype, 'toISOString').mockReturnValue(`${today}T12:00:00.000Z`);

    const { result } = renderHook(() => useStreak());


    act(() => {
      result.current.resetStreak();
    });


    expect(result.current.streakData).toEqual({
      currentStreak: 0,
      lastInteractionDate: today,
      highestStreak: 0,
    });
    expect(result.current.showNotification).toBe(false);
  });

  it('should hide notification when hideNotification is called', () => {
    const { result } = renderHook(() => useStreak());


    act(() => {
      result.current.updateStreak();
    });

    expect(result.current.showNotification).toBe(true);


    act(() => {
      result.current.hideNotification();
    });

    expect(result.current.showNotification).toBe(false);
  });
}); 