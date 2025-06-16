
import { useState, useEffect } from "react";
import WorkoutPlan from "@/components/WorkoutPlan";
import ProgressTracker from "@/components/ProgressTracker";
import SettingsPanel from "@/components/SettingsPanel";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Settings, Download, Play } from "lucide-react";

export interface WorkoutDay {
  week: number;
  day: number;
  title: string;
  description: string;
  completed: boolean;
  scheduledDate?: Date;
  completedDate?: Date;
}

export interface ProgramSettings {
  startDate: Date;
  goalDistance: number; // Changed to number for kilometers
  goalTime?: string;
  restDays: number[];
  programWeeks: number; // New setting
  trainingDaysPerWeek: number; // New setting
}

const Index = () => {
  const [workoutData, setWorkoutData] = useState<WorkoutDay[]>([]);
  const [settings, setSettings] = useState<ProgramSettings>({
    startDate: new Date(),
    goalDistance: 5, // Default 5K
    restDays: [0, 6], // Sunday and Saturday
    programWeeks: 9, // Default 9 weeks
    trainingDaysPerWeek: 3, // Default 3 days per week
  });
  const [currentWeek, setCurrentWeek] = useState(1);

  // Initialize workout plan
  useEffect(() => {
    const initialWorkouts = generateWorkoutPlan();
    setWorkoutData(initialWorkouts);
  }, [settings.programWeeks, settings.trainingDaysPerWeek, settings.goalDistance]);

  // Generate dynamic workout plan based on settings
  const generateWorkoutPlan = (): WorkoutDay[] => {
    const workouts: WorkoutDay[] = [];
    const { programWeeks, trainingDaysPerWeek, goalDistance } = settings;
    
    // Calculate progression intervals
    const totalWorkouts = programWeeks * trainingDaysPerWeek;
    const finalRunTime = Math.max(20, goalDistance * 4); // Rough estimate: 4 min per km minimum
    
    for (let week = 1; week <= programWeeks; week++) {
      const weekProgress = (week - 1) / (programWeeks - 1); // 0 to 1
      
      for (let day = 1; day <= trainingDaysPerWeek; day++) {
        let description = "";
        
        if (week <= Math.ceil(programWeeks * 0.3)) {
          // Early weeks: Walk/Run intervals
          const runTime = Math.ceil(60 + (weekProgress * 120)); // 60s to 180s
          const walkTime = Math.ceil(120 - (weekProgress * 60)); // 120s to 60s
          const intervals = Math.ceil(8 - (weekProgress * 3)); // 8 to 5 intervals
          description = `${runTime}s run, ${walkTime}s walk (${intervals}x)`;
        } else if (week <= Math.ceil(programWeeks * 0.6)) {
          // Middle weeks: Longer intervals
          const runTime = Math.ceil(3 + (weekProgress * 5)); // 3 to 8 minutes
          const walkTime = Math.ceil(3 - (weekProgress * 1)); // 3 to 2 minutes
          description = `${runTime}min run, ${walkTime}min walk (3x)`;
        } else {
          // Final weeks: Continuous running
          const runTime = Math.ceil(15 + (weekProgress * (finalRunTime - 15)));
          description = `${runTime}min continuous run`;
        }
        
        workouts.push({
          week,
          day,
          title: `Week ${week}, Day ${day}`,
          description,
          completed: false,
        });
      }
    }

    return workouts;
  };

  const updateWorkout = (week: number, day: number, updates: Partial<WorkoutDay>) => {
    setWorkoutData(prev => 
      prev.map(workout => 
        workout.week === week && workout.day === day 
          ? { ...workout, ...updates }
          : workout
      )
    );
  };

  const postponeWorkout = (week: number, day: number, newDate: Date) => {
    updateWorkout(week, day, { scheduledDate: newDate });
    // Recalculate subsequent workout dates
    rescheduleProgram(week, day, newDate);
  };

  const rescheduleProgram = (fromWeek: number, fromDay: number, newStartDate: Date) => {
    // Logic to adjust all subsequent workouts based on postponement
    console.log(`Rescheduling from Week ${fromWeek}, Day ${fromDay} starting ${newStartDate}`);
  };

  const completedWorkouts = workoutData.filter(w => w.completed).length;
  const totalWorkouts = workoutData.length;
  const progressPercentage = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Couch to {settings.goalDistance}K
          </h1>
          <p className="text-lg text-gray-600">Your journey to running starts here</p>
        </div>

        {/* Progress Overview */}
        <Card className="mb-8 bg-white/70 backdrop-blur-sm border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="w-5 h-5 text-blue-600" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{completedWorkouts}</div>
                <div className="text-sm text-gray-600">Workouts Complete</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{currentWeek}</div>
                <div className="text-sm text-gray-600">Current Week</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{Math.round(progressPercentage)}%</div>
                <div className="text-sm text-gray-600">Overall Progress</div>
              </div>
              <div className="text-center p-4 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{settings.goalDistance}K</div>
                <div className="text-sm text-gray-600">Goal Distance</div>
              </div>
            </div>
            <div className="mt-4">
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="workouts" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="workouts" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Workouts
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Settings className="w-4 h-4" />
              Settings
            </TabsTrigger>
          </TabsList>

          <TabsContent value="workouts">
            <WorkoutPlan 
              workouts={workoutData}
              currentWeek={currentWeek}
              onUpdateWorkout={updateWorkout}
              onPostponeWorkout={postponeWorkout}
              settings={settings}
            />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTracker 
              workouts={workoutData}
              settings={settings}
            />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel 
              settings={settings}
              onUpdateSettings={setSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
