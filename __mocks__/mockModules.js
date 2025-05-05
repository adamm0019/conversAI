
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