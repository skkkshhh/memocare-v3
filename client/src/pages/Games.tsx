import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { gamesApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { Brain, Trophy, RotateCcw, Home, ArrowLeft, ArrowRight } from 'lucide-react';

interface QuizQuestion {
  type: string;
  question: string;
  answer: string;
  options: string[];
}

export default function Games() {
  const [gameState, setGameState] = useState<'menu' | 'quiz' | 'results'>('menu');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [score, setScore] = useState(0);
  const [timeStarted, setTimeStarted] = useState<Date | null>(null);
  const { toast } = useToast();

  const { data: questions = [], isLoading, refetch } = useQuery({
    queryKey: ['quiz-questions'],
    queryFn: gamesApi.getQuiz,
    enabled: gameState === 'quiz',
  });

  const startQuiz = () => {
    setGameState('quiz');
    setCurrentQuestionIndex(0);
    setSelectedAnswers([]);
    setCurrentAnswer('');
    setScore(0);
    setTimeStarted(new Date());
    refetch();
  };

  const selectAnswer = (answer: string) => {
    setCurrentAnswer(answer);
  };

  const nextQuestion = () => {
    const newAnswers = [...selectedAnswers, currentAnswer];
    setSelectedAnswers(newAnswers);
    
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setCurrentAnswer('');
    } else {
      // Calculate final score
      let finalScore = 0;
      questions.forEach((question: QuizQuestion, index: number) => {
        if (newAnswers[index]?.toLowerCase() === question.answer.toLowerCase()) {
          finalScore++;
        }
      });
      setScore(finalScore);
      setGameState('results');
    }
  };

  const previousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
      setCurrentAnswer(selectedAnswers[currentQuestionIndex - 1] || '');
    }
  };

  const retakeQuiz = () => {
    startQuiz();
  };

  const backToDashboard = () => {
    setGameState('menu');
  };

  const getTimeTaken = () => {
    if (!timeStarted) return '0:00';
    const seconds = Math.floor((Date.now() - timeStarted.getTime()) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  if (isLoading && gameState === 'quiz') {
    return (
      <div className="p-8">
        <div className="text-center">Loading quiz questions...</div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        {/* Game Menu */}
        {gameState === 'menu' && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-semibold text-foreground mb-4" data-testid="games-title">
                Memory Games
              </h2>
              <p className="text-xl text-muted-foreground">
                Exercise your mind with fun memory challenges
              </p>
            </div>

            <Card className="max-w-2xl mx-auto" data-testid="card-game-menu">
              <CardContent className="p-8 text-center">
                <div className="w-24 h-24 bg-accent rounded-full flex items-center justify-center mx-auto mb-6">
                  <Brain className="text-4xl text-accent-foreground" />
                </div>
                <h3 className="text-3xl font-semibold text-card-foreground mb-4">
                  Daily Memory Quiz
                </h3>
                <p className="text-lg text-muted-foreground mb-8">
                  Test your memory with personalized questions about your contacts, medications, and memories.
                  The quiz adapts to your personal information to make it meaningful and engaging.
                </p>
                
                <div className="grid grid-cols-3 gap-6 mb-8 text-center">
                  <div>
                    <div className="text-2xl font-bold text-accent">6</div>
                    <div className="text-sm text-muted-foreground">Questions</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-primary">~5 min</div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-secondary">Personal</div>
                    <div className="text-sm text-muted-foreground">Content</div>
                  </div>
                </div>

                <Button 
                  size="lg" 
                  onClick={startQuiz}
                  className="text-xl px-8 py-4"
                  data-testid="button-start-quiz"
                >
                  Start Quiz
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz Game */}
        {gameState === 'quiz' && currentQuestion && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-semibold text-foreground mb-4">Daily Memory Quiz</h2>
              <p className="text-xl text-muted-foreground">Test your memory with questions about your life</p>
            </div>

            {/* Quiz Progress */}
            <Card className="mb-8" data-testid="card-quiz-progress">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-2xl font-semibold">
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </h3>
                  <div className="flex space-x-2">
                    {questions.map((_: any, index: number) => (
                      <div
                        key={index}
                        className={`w-4 h-4 rounded-full ${
                          index < currentQuestionIndex
                            ? 'bg-accent'
                            : index === currentQuestionIndex
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <Progress value={progress} className="h-3" />
              </CardContent>
            </Card>

            {/* Quiz Question */}
            <Card className="mb-8" data-testid="card-quiz-question">
              <CardContent className="p-8">
                <div className="text-center mb-8">
                  <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-muted flex items-center justify-center">
                    <Brain className="w-16 h-16 text-muted-foreground" />
                  </div>
                  <h3 className="text-3xl font-semibold text-card-foreground mb-4">
                    {currentQuestion.question}
                  </h3>
                  <p className="text-lg text-muted-foreground">Select the correct answer</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <Button
                      key={index}
                      variant={currentAnswer === option ? 'default' : 'outline'}
                      className="p-6 text-left h-auto justify-start"
                      onClick={() => selectAnswer(option)}
                      data-testid={`button-option-${index}`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          currentAnswer === option 
                            ? 'border-primary bg-primary' 
                            : 'border-muted-foreground'
                        }`}>
                          {currentAnswer === option && (
                            <div className="w-2 h-2 rounded-full bg-primary-foreground"></div>
                          )}
                        </div>
                        <span className="text-xl">{option}</span>
                      </div>
                    </Button>
                  ))}
                </div>

                <div className="flex justify-between">
                  <Button
                    variant="outline"
                    onClick={previousQuestion}
                    disabled={currentQuestionIndex === 0}
                    data-testid="button-previous"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={nextQuestion}
                    disabled={!currentAnswer}
                    data-testid="button-next"
                  >
                    {currentQuestionIndex === questions.length - 1 ? 'Finish' : 'Next'}
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Quiz Results */}
        {gameState === 'results' && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-4xl font-semibold text-foreground mb-4">Quiz Complete!</h2>
              <p className="text-xl text-muted-foreground">Here are your results</p>
            </div>

            <Card className="max-w-2xl mx-auto" data-testid="card-quiz-results">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="text-2xl text-accent-foreground" />
                </div>
                <h3 className="text-2xl font-semibold text-card-foreground mb-2">Great job!</h3>
                <p className="text-lg text-muted-foreground mb-6">
                  You answered {score} out of {questions.length} questions correctly
                </p>

                <div className="grid grid-cols-3 gap-6 mb-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-accent" data-testid="score-percentage">
                      {Math.round((score / questions.length) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">Score</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-primary" data-testid="score-fraction">
                      {score}/{questions.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Correct</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary" data-testid="time-taken">
                      {getTimeTaken()}
                    </div>
                    <div className="text-sm text-muted-foreground">Time</div>
                  </div>
                </div>

                <div className="flex space-x-4 justify-center">
                  <Button 
                    onClick={retakeQuiz}
                    data-testid="button-retake-quiz"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Try Again
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={backToDashboard}
                    data-testid="button-back-dashboard"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
