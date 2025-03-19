// File: /src/components/QuizSummary.tsx
import React from 'react';
import { QuizQuestionResult } from './QuizPage';
import FixedQuizMathRenderer from './math/FixedQuizMathRenderer';
import { MathJax } from 'better-react-mathjax';
import AiTestFeedback from './AiTestFeedback';

type QuizSummaryProps = {
  questions: QuizQuestionResult[];
  correctCount: number;
  onBackToTopics: () => void;
  onTryAgain?: () => void;
  moduleTitle?: string;
  testAttemptId?: number;
};

const QuizSummary: React.FC<QuizSummaryProps> = ({
  questions,
  correctCount,
  onBackToTopics,
  onTryAgain,
  moduleTitle = 'Quiz',
  testAttemptId
}) => {
  const totalCount = questions.length;
  const incorrectCount = totalCount - correctCount;
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Back button */}
      <div className="p-4 flex items-center">
        <button 
          onClick={onBackToTopics}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Topics
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className={`text-2xl font-semibold mb-6 ${questions.length > 6 ? 'sticky top-0 bg-white pt-2 pb-2 z-10' : ''}`}>
          {moduleTitle} Summary
        </h2>
        
        {/* Results stats */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 ${questions.length > 6 ? 'sticky top-14 bg-white z-10 pb-4' : ''}`}>
          <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm">
            <div className="text-sm text-blue-700 mb-1">Total Questions</div>
            <div className="text-3xl font-bold text-blue-800">{totalCount}</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg text-center shadow-sm">
            <div className="text-sm text-green-700 mb-1">Correct Answers</div>
            <div className="text-3xl font-bold text-green-800">{correctCount}</div>
          </div>
          <div className="bg-red-50 p-4 rounded-lg text-center shadow-sm">
            <div className="text-sm text-red-700 mb-1">Incorrect Answers</div>
            <div className="text-3xl font-bold text-red-800">{incorrectCount}</div>
          </div>
        </div>
        
        {/* Performance message */}
        <div className="text-center mb-6">
          <div className="text-lg font-medium">
            {(correctCount / totalCount) * 100 >= 80
              ? '🎉 Excellent work! You\'ve mastered this topic.'
              : (correctCount / totalCount) * 100 >= 60
              ? '👍 Good effort! Keep practicing to improve further.'
              : '💪 Keep practicing! You\'ll get better with more attempts.'}
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {`You scored ${correctCount} out of ${totalCount} questions (${Math.round((correctCount / totalCount) * 100)}%)`}
          </div>
        </div>

        {/* AI Feedback Section */}
        {testAttemptId && (
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4">AI Teacher Feedback</h3>
            <AiTestFeedback testAttemptId={testAttemptId} />
          </div>
        )}

        {/* Questions List */}
        <h3 className="text-xl font-medium mb-4">Question Details</h3>
        <div className="space-y-4 mb-8">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-start gap-3 mb-3">
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  question.correctAnswer === question.userAnswer
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {question.correctAnswer === question.userAnswer ? '✓' : '✗'}
                </div>
                <div className="font-medium text-lg mb-2">Question {index + 1}</div>
              </div>
              
              <div className="ml-11">
                <div className="mb-3">
                  <FixedQuizMathRenderer content={question.question} />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className={`p-3 rounded ${
                    question.correctAnswer === question.userAnswer
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="text-sm font-medium mb-1">Your Answer:</div>
                    <div>{question.userAnswer}</div>
                  </div>
                  
                  {question.correctAnswer !== question.userAnswer && (
                    <div className="p-3 rounded bg-green-50 border border-green-200">
                      <div className="text-sm font-medium mb-1">Correct Answer:</div>
                      <div>{question.correctAnswer}</div>
                    </div>
                  )}
                </div>
                
                <div className="p-3 rounded bg-blue-50 border border-blue-200">
                  <div className="text-sm font-medium mb-1">Explanation:</div>
                  <div>
                    <MathJax>
                      {question.explanation}
                    </MathJax>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Action buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={onBackToTopics}
            className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Back to Topics
          </button>
          
          {onTryAgain && (
            <button 
              onClick={onTryAgain}
              className="px-6 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
            >
              Try Again
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default QuizSummary;