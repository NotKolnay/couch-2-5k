
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
  goalDistance: string;
  goalTime?: string;
  restDays: number[];
}

const Index = () => {
  const [workoutData, setWorkoutData] = useState<WorkoutDay[]>([]);
  const [settings, setSettings] = useState<ProgramSettings>({
    startDate: new Date(),
    goalDistance: "5K",
    restDays: [0, 6], // Sunday and Saturday
  });
  const [currentWeek, setCurrentWeek] = useState(1);

  // Initialize workout plan
  useEffect(() => {
    const initialWorkouts = generateWorkoutPlan();
    setWorkoutData(initialWorkouts);
  }, []);

  // Generate the 9-week Couch to 5K plan
  const generateWorkoutPlan = (): WorkoutDay[] => {
    const workouts: WorkoutDay[] = [];
    const plans = [
      // Week 1-3: Walk/Run intervals
      { week: 1, days: ["60s run, 90s walk (8x)", "60s run, 90s walk (8x)", "60s run, 90s walk (8x)"] },
      { week: 2, days: ["90s run, 2min walk (6x)", "90s run, 2min walk (6x)", "90s run, 2min walk (6x)"] },
      { week: 3, days: ["90s run, 90s walk, 3min run, 3min walk (2x)", "90s run, 90s walk, 3min run, 3min walk (2x)", "90s run, 90s walk, 3min run, 3min walk (2x)"] },
      // Week 4-6: Longer runs
      { week: 4, days: ["3min run, 90s walk, 5min run, 2.5min walk, 3min run", "5min run, 3min walk, 5min run", "3min run, 90s walk, 5min run, 2.5min walk, 3min run"] },
      { week: 5, days: ["5min run, 3min walk, 5min run, 3min walk, 5min run", "8min run, 5min walk, 8min run", "20min run"] },
      { week: 6, days: ["5min run, 3min walk, 8min run, 3min walk, 5min run", "10min run, 3min walk, 10min run", "25min run"] },
      // Week 7-9: Continuous running
      { week: 7, days: ["25min run", "25min run", "25min run"] },
      { week: 8, days: ["28min run", "28min run", "28min run"] },
      { week: 9, days: ["30min run", "30min run", "30min run"] },
    ];

    plans.forEach(({ week, days }) => {
      days.forEach((description, dayIndex) => {
        workouts.push({
          week,
          day: dayIndex + 1,
          title: `Week ${week}, Day ${dayIndex + 1}`,
          description,
          completed: false,
        });
      });
    });

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
            Couch to {settings.goalDistance}
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
                <div className="text-2xl font-bold text-orange-600">{settings.goalDistance}</div>
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
