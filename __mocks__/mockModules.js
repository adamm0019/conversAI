jest.mock('react-markdown', () => {
  return function MockMarkdown(props) {
    return {
      type: 'div',
      props: {
        'data-testid': 'markdown',
        children: props.children
      }
    };
  };
});

jest.mock('rehype-highlight', () => {
  return () => { };
});

jest.mock('rehype-raw', () => {
  return () => { };
});

jest.mock('remark-gfm', () => {
  return () => { };
});

jest.mock('@mantine/core', () => {
  const actual = jest.requireActual('@mantine/core');
  return {
    ...actual,
    Tooltip: function MockTooltip(props) { return props.children; },
    Popover: function MockPopover(props) { return props.children; },
  };
});


jest.mock('firebase/app', () => {
  return {
    initializeApp: jest.fn().mockReturnValue({}),
  };
});

jest.mock('firebase/firestore', () => {
  return {
    getFirestore: jest.fn().mockReturnValue({}),
    collection: jest.fn(),
    doc: jest.fn(),
    getDoc: jest.fn(),
    setDoc: jest.fn(),
    updateDoc: jest.fn(),
    serverTimestamp: jest.fn(),
  };
});

jest.mock('firebase/auth', () => {
  return {
    getAuth: jest.fn().mockReturnValue({}),
  };
});

module.exports = {};

jest.mock('../src/services/AzurePronunciationService', () => {
  return {
    useAzurePronunciation: jest.fn().mockReturnValue({
      assessPronunciation: jest.fn().mockResolvedValue({
        detailedResults: [],
        overallScore: 80,
        prosodyScore: 75,
        pronunciationScore: 85,
        accuracyScore: 90,
        fluencyScore: 80,
        completenessScore: 95,
        assessmentStatus: 'Success'
      }),
      isAssessing: false,
      error: null
    }),
    FeedbackType: {
      PRONUNCIATION: 'pronunciation',
      GRAMMAR: 'grammar',
      VOCABULARY: 'vocabulary'
    }
  };
}); 