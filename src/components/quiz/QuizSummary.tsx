// File: /src/components/QuizSummary.tsx
import React, { useEffect, useState } from 'react';
import { QuizQuestionResult, LearningGap, Recommendation } from '@/types/quiz';
import FixedQuizMathRenderer from '../math/FixedQuizMathRenderer';
import { MathJax } from 'better-react-mathjax';
import AiTestFeedback from '../AiTestFeedback';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Brain, AlertTriangle, Activity, LightbulbIcon } from 'lucide-react';

type QuizSummaryProps = {
  questions: QuizQuestionResult[];
  correctCount: number;
  onBackToTopics: () => void;
  onTryAgain?: () => void;
  moduleTitle?: string;
  testAttemptId?: number;
  subjectType?: 'maths' | 'quantitative';
  topicId?: number;
  subtopicId?: number;
  learningGaps?: LearningGap[]; // Fixed the typo: earningGaps -> learningGaps
  adaptiveRecommendations?: Recommendation[]; 
  adaptiveLearningEnabled?: boolean;
};

// Type definitions for topic and subtopic data
type TopicInfo = {
  id: number;
  name: string;
  description: string;
};

type SubtopicInfo = {
  id: number;
  name: string;
  description: string;
  topicId: number;
};

const QuizSummary: React.FC<QuizSummaryProps> = ({
  questions,
  correctCount,
  onBackToTopics,
  onTryAgain,
  moduleTitle = 'Quiz',
  testAttemptId,
  subjectType = 'maths',
  topicId,
  subtopicId,
  learningGaps = [],
  adaptiveRecommendations = [],
  adaptiveLearningEnabled = true
}) => {
  const totalCount = questions.length;
  const incorrectCount = totalCount - correctCount;
  const scorePercentage = Math.round((correctCount / totalCount) * 100);
  
  // State for topic and subtopic information
  const [topicInfo, setTopicInfo] = useState<TopicInfo | null>(null);
  const [subtopicInfo, setSubtopicInfo] = useState<SubtopicInfo | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Fetch topic and subtopic information
  useEffect(() => {
    const fetchTopicAndSubtopicInfo = async () => {
      if (!topicId || !subtopicId) return;
      
      setLoading(true);
      try {
        // First fetch topic information
        const topicResponse = await fetch(`/api/${subjectType}/${topicId}`);
        if (topicResponse.ok) {
          const topicData = await topicResponse.json();
          if (topicData.topic) {
            setTopicInfo(topicData.topic);
          }
        }
        
        // Then fetch subtopic details
        const subtopicsResponse = await fetch(`/api/${subjectType}/${topicId}?subtopicId=${subtopicId}`);
        if (subtopicsResponse.ok) {
          const subtopicsData = await subtopicsResponse.json();
          if (subtopicsData.subtopics) {
            const subtopic = subtopicsData.subtopics.find((st: SubtopicInfo) => st.id === subtopicId);
            if (subtopic) {
              setSubtopicInfo(subtopic);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching topic/subtopic info:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTopicAndSubtopicInfo();
  }, [topicId, subtopicId, subjectType]);
  
  // Prepare data for pie chart
  const pieChartData = [
    { name: 'Correct', value: correctCount, color: '#10B981' },
    { name: 'Incorrect', value: incorrectCount, color: '#EF4444' }
  ].filter(item => item.value > 0);
  
  // Calculate mastery level based on score
  const getMasteryLevel = () => {
    if (scorePercentage >= 80) return "Mastered";
    if (scorePercentage >= 60) return "Learning";
    return "To Start";
  };
  
  // Get performance message based on score
  const getPerformanceMessage = () => {
    if (scorePercentage >= 80) {
      return '🎉 Excellent work! You\'ve mastered this topic.';
    }
    if (scorePercentage >= 60) {
      return '👍 Good effort! Keep practicing to improve further.';
    }
    return '💪 Keep practicing! You\'ll get better with more attempts.';
  };
  
  // Generate next steps recommendation
  const getNextStepsRecommendation = () => {
    const masteryLevel = getMasteryLevel();
    
    if (masteryLevel === "Mastered") {
      return "Try practicing a new subtopic or revisit this one periodically to maintain mastery.";
    }
    
    if (masteryLevel === "Learning") {
      return "Review the questions you missed and try this practice again to improve your mastery.";
    }
    
    return "Focus on the core concepts in this subtopic and practice with these questions again.";
  };
  
  // Detect common mistakes
  const analyzeCommonMistakes = () => {
    // Only analyze incorrect questions
    const incorrectQuestions = questions.filter(q => q.correctAnswer !== q.userAnswer);
    
    if (incorrectQuestions.length === 0) {
      return null;
    }
    
    const patterns = {
      calculationErrors: 0,
      conceptualErrors: 0,
      carelessMistakes: 0
    };
    
    // Basic analysis - we could make this more sophisticated
    incorrectQuestions.forEach(q => {
      // Look for calculation keywords in the explanation
      if (q.explanation.toLowerCase().includes('calculat') || 
          q.explanation.toLowerCase().includes('arithmetic')) {
        patterns.calculationErrors++;
      }
      
      // Look for conceptual misunderstanding keywords
      if (q.explanation.toLowerCase().includes('concept') ||
          q.explanation.toLowerCase().includes('understand') ||
          q.explanation.toLowerCase().includes('principle')) {
        patterns.conceptualErrors++;
      }
      
      // Look for careless mistake indicators
      if (q.explanation.toLowerCase().includes('careful') ||
          q.explanation.toLowerCase().includes('attention') ||
          q.explanation.toLowerCase().includes('oversight')) {
        patterns.carelessMistakes++;
      }
    });
    
    // Determine the most common type of mistake
    let mostCommonMistake = null;
    let maxCount = 0;
    
    for (const [type, count] of Object.entries(patterns)) {
      if (count > maxCount) {
        maxCount = count;
        mostCommonMistake = type;
      }
    }
    
    if (maxCount === 0) {
      return null; // No clear pattern detected
    }
    
    // Format the message based on the most common mistake
    switch (mostCommonMistake) {
      case 'calculationErrors':
        return "Take your time with calculations and double-check your work. Practice arithmetic skills separately.";
      case 'conceptualErrors':
        return "Review the core concepts for this subtopic. Try to understand the underlying principles before attempting more questions.";
      case 'carelessMistakes':
        return "Pay careful attention to all details in the questions. Read each question twice before answering.";
      default:
        return null;
    }
  };

  // 3. Add a new section to display adaptive learning information
  const renderAdaptiveLearningSection = () => {
    if (!adaptiveLearningEnabled) {
      return null;
    }
    return (
      <div className="mb-8 bg-indigo-50 p-4 rounded-lg border border-indigo-100">
        <h3 className="flex items-center gap-2 text-lg font-medium text-indigo-800 mb-3">
          <Brain className="h-5 w-5 text-indigo-600" />
          Adaptive Learning Insights
        </h3>

        {learningGaps.length > 0 ? (
          <div className="mb-4">
            <h4 className="text-sm font-medium text-indigo-700 mb-2">Learning Gaps Identified</h4>
            <div className="space-y-2">
              {learningGaps.map((gap) => (
                <div key={gap.id} className="bg-white p-3 rounded-md border border-indigo-200">
                  <div className="flex items-start">
                    <div className="shrink-0 mt-1">
                      <div className={`w-2 h-2 rounded-full ${
                        gap.severity > 7 ? 'bg-red-500' : 
                        gap.severity > 4 ? 'bg-amber-500' : 
                        'bg-yellow-500'
                      }`}></div>
                    </div>
                    <div className="ml-2">
                      <p className="text-sm text-indigo-800">
                        {gap.conceptDescription}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 bg-white p-3 rounded-md border border-indigo-200">
            <p className="text-sm text-indigo-800">
              No specific learning gaps identified from this practice session.
            </p>
          </div>
        )}

        {adaptiveRecommendations.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-indigo-700 mb-2">Recommendations</h4>
            <div className="space-y-2">
              {adaptiveRecommendations.map((rec, index) => (
                <div key={index} className="bg-white p-3 rounded-md border border-indigo-200">
                  <div className="flex items-start">
                    <div className="shrink-0 mt-0.5">
                      {rec.type === 'learning_gap' ? (
                        <AlertTriangle className="h-4 w-4 text-amber-500" />
                      ) : rec.type === 'performance' ? (
                        <Activity className="h-4 w-4 text-blue-500" />
                      ) : (
                        <LightbulbIcon className="h-4 w-4 text-green-500" />
                      )}
                    </div>
                    <div className="ml-2">
                      <p className="text-sm font-medium text-indigo-800">{rec.message}</p>
                      <p className="text-xs text-indigo-600 mt-1">{rec.action}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 text-xs text-indigo-600">
          <p>
            Our adaptive learning system analyzes your performance patterns to provide personalized recommendations 
            and identify areas that may need more practice.
          </p>
        </div>
      </div>
    );
  };
  
  const commonMistakesAdvice = analyzeCommonMistakes();
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        {/* Title section with topic/subtopic info */}
        <h2 className={`text-2xl font-semibold mb-2 ${questions.length > 6 ? 'sticky top-0 bg-white pt-2 pb-2 z-10' : ''}`}>
          {moduleTitle} Summary
        </h2>
        
        {loading ? (
          <div className="text-gray-500 text-sm mb-4">Loading topic information...</div>
        ) : (
          <div className="text-gray-600 text-sm mb-6">
            {topicInfo && <span>Topic: <span className="font-medium">{topicInfo.name}</span></span>}
            {subtopicInfo && <span> • Subtopic: <span className="font-medium">{subtopicInfo.name}</span></span>}
          </div>
        )}
        
        {/* Results visualization section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row">
            {/* Left side: Stats and pie chart */}
            <div className="lg:w-1/2 mb-6 lg:mb-0">
              <div className={`grid grid-cols-1 md:grid-cols-3 gap-4 mb-6`}>
                <div className="bg-blue-50 p-4 rounded-lg text-center shadow-sm">
                  <div className="text-sm text-blue-700 mb-1">Total Questions</div>
                  <div className="text-3xl font-bold text-blue-800">{totalCount}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg text-center shadow-sm">
                  <div className="text-sm text-green-700 mb-1">Correct</div>
                  <div className="text-3xl font-bold text-green-800">{correctCount}</div>
                </div>
                <div className="bg-red-50 p-4 rounded-lg text-center shadow-sm">
                  <div className="text-sm text-red-700 mb-1">Incorrect</div>
                  <div className="text-3xl font-bold text-red-800">{incorrectCount}</div>
                </div>
              </div>
              
              {/* Score visualization */}
              <div className="flex items-center justify-center h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieChartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {pieChartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [`${value} questions`, '']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Right side: Mastery and recommendations */}
            <div className="lg:w-1/2 lg:pl-8">
              <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <h3 className="text-lg font-medium text-blue-800 mb-3">Your Performance</h3>
                <div className="text-center mb-4">
                  <div className="inline-block px-4 py-2 rounded-full bg-white shadow-sm border border-blue-200">
                    <span className="text-2xl font-bold text-blue-600">{scorePercentage}%</span>
                  </div>
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Mastery Level</span>
                    <span className={`font-medium ${
                      getMasteryLevel() === "Mastered" ? "text-green-600" :
                      getMasteryLevel() === "Learning" ? "text-yellow-600" :
                      "text-red-600"
                    }`}>
                      {getMasteryLevel()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        getMasteryLevel() === "Mastered" ? "bg-green-500" :
                        getMasteryLevel() === "Learning" ? "bg-yellow-500" :
                        "bg-red-500"
                      }`}
                      style={{ width: `${scorePercentage}%` }}
                    ></div>
                  </div>
                </div>
                <p className="text-blue-700 mt-3">
                  {getPerformanceMessage()}
                </p>
              </div>
              
              {/* Recommendations section */}
              <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                <h3 className="text-lg font-medium text-purple-800 mb-2">Next Steps</h3>
                <p className="text-purple-700 mb-3">
                  {getNextStepsRecommendation()}
                </p>
                
                {commonMistakesAdvice && (
                  <div className="mt-4 pt-4 border-t border-purple-200">
                    <h4 className="text-sm font-medium text-purple-800 mb-1">Improvement Tip:</h4>
                    <p className="text-sm text-purple-700">{commonMistakesAdvice}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Feedback Section */}
        {testAttemptId && (
          <div className="mb-8">
            <h3 className="text-xl font-medium mb-4">AI Teacher Feedback</h3>
            <AiTestFeedback testAttemptId={testAttemptId} subjectType={subjectType}/>
          </div>
        )}

        {/* Adaptive Learning Section */}
        {renderAdaptiveLearningSection()}

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