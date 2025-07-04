import { useState, useEffect } from "react";
import WorkoutPlan from "@/components/WorkoutPlan";
import ProgressTracker from "@/components/ProgressTracker";
import SettingsPanel from "@/components/SettingsPanel";
import CalendarView from "@/components/CalendarView";
import SocialDashboard from "@/components/social/SocialDashboard";
import SocialSetup from "@/components/social/SocialSetup";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Settings, Download, Play, CalendarDays, Users } from "lucide-react";
import { addDays, format } from "date-fns";
import { useSocial } from "@/contexts/SocialContext";

export interface WorkoutDay {
  week: number;
  day: number;
  title: string;
  description: string;
  completed: boolean;
  skipped: boolean;
  scheduledDate?: Date;
  completedDate?: Date;
}

export interface ProgramSettings {
  startDate: Date;
  goalDistance: number;
  startingDistance: number;
  restDays: number[];
  programWeeks: number;
  trainingDaysPerWeek: number;
  walkingSpeed: number; // km/hr
  runningSpeed: number; // km/hr
}

const Index = () => {
  const [workoutData, setWorkoutData] = useState<WorkoutDay[]>([]);
  const [settings, setSettings] = useState<ProgramSettings>({
    startDate: new Date(),
    goalDistance: 5,
    startingDistance: 0,
    restDays: [0, 6],
    programWeeks: 9,
    trainingDaysPerWeek: 3,
    walkingSpeed: 5,
    runningSpeed: 9,
  });
  const [currentWeek, setCurrentWeek] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);
  const { currentUser } = useSocial();

  // Load data from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('running-planner-settings');
    const savedWorkouts = localStorage.getItem('running-planner-workouts');
    const savedCurrentWeek = localStorage.getItem('running-planner-current-week');
    
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      // Convert date string back to Date object
      parsedSettings.startDate = new Date(parsedSettings.startDate);
      setSettings(parsedSettings);
    }
    
    if (savedWorkouts) {
      const parsedWorkouts = JSON.parse(savedWorkouts);
      // Convert date strings back to Date objects
      const workoutsWithDates = parsedWorkouts.map((workout: any) => ({
        ...workout,
        scheduledDate: workout.scheduledDate ? new Date(workout.scheduledDate) : undefined,
        completedDate: workout.completedDate ? new Date(workout.completedDate) : undefined,
      }));
      setWorkoutData(workoutsWithDates);
    }

    if (savedCurrentWeek) {
      setCurrentWeek(parseInt(savedCurrentWeek));
    }

    setIsInitialized(true);
  }, []);

  // Save to localStorage whenever settings, workouts, or current week change
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('running-planner-settings', JSON.stringify(settings));
    }
  }, [settings, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('running-planner-workouts', JSON.stringify(workoutData));
    }
  }, [workoutData, isInitialized]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('running-planner-current-week', currentWeek.toString());
    }
  }, [currentWeek, isInitialized]);

  // Generate dynamic workout plan based on settings
  const generateWorkoutPlan = (): WorkoutDay[] => {
    const workouts: WorkoutDay[] = [];
    const { programWeeks, trainingDaysPerWeek, goalDistance, startingDistance, walkingSpeed, runningSpeed } = settings;
    
    const totalWorkouts = programWeeks * trainingDaysPerWeek;
    
    for (let week = 1; week <= programWeeks; week++) {
      for (let day = 1; day <= trainingDaysPerWeek; day++) {
        const workoutIndex = ((week - 1) * trainingDaysPerWeek) + day - 1;
        const progressRatio = workoutIndex / Math.max(totalWorkouts - 1, 1);
        
        let description = "";
        let calculatedDistance = 0;
        
        if (week <= Math.ceil(programWeeks * 0.4)) {
          // Early weeks: Walk/Run intervals with increasing run time
          const baseRunTime = 60; // Start with 60 seconds
          const maxRunTime = 300; // Up to 5 minutes
          const runSeconds = Math.round(baseRunTime + (progressRatio * (maxRunTime - baseRunTime) * 0.5));
          
          const baseWalkTime = 120; // Start with 2 minutes
          const minWalkTime = 60; // Down to 1 minute
          const walkSeconds = Math.round(baseWalkTime - (progressRatio * (baseWalkTime - minWalkTime) * 0.5));
          
          const intervals = Math.max(3, 8 - Math.floor(progressRatio * 5)); // 8 down to 3 intervals
          
          // Calculate distance based on time and speeds
          const totalRunTime = (runSeconds * intervals) / 3600; // Convert to hours
          const totalWalkTime = (walkSeconds * intervals) / 3600; // Convert to hours
          calculatedDistance = (totalRunTime * runningSpeed) + (totalWalkTime * walkingSpeed);
          
          // Scale distance to fit progression from starting to goal distance
          const targetForThisWorkout = startingDistance + (progressRatio * (goalDistance - startingDistance));
          calculatedDistance = Math.max(targetForThisWorkout, calculatedDistance);
          
          description = `${runSeconds}s run, ${walkSeconds}s walk (${intervals}x) - Target: ${calculatedDistance.toFixed(1)}km`;
        } else if (week <= Math.ceil(programWeeks * 0.7)) {
          // Middle weeks: Longer intervals
          const baseRunTime = 3; // 3 minutes
          const maxRunTime = 12; // Up to 12 minutes
          const runMinutes = Math.round(baseRunTime + (progressRatio * (maxRunTime - baseRunTime) * 0.7));
          
          const baseWalkTime = 3; // 3 minutes
          const minWalkTime = 1; // Down to 1 minute
          const walkMinutes = Math.max(1, Math.round(baseWalkTime - (progressRatio * (baseWalkTime - minWalkTime) * 0.7)));
          
          const intervals = 3;
          
          // Calculate distance based on time and speeds
          const totalRunTime = (runMinutes * intervals) / 60; // Convert to hours
          const totalWalkTime = (walkMinutes * intervals) / 60; // Convert to hours
          calculatedDistance = (totalRunTime * runningSpeed) + (totalWalkTime * walkingSpeed);
          
          // Scale distance to fit progression
          const targetForThisWorkout = startingDistance + (progressRatio * (goalDistance - startingDistance));
          calculatedDistance = Math.max(targetForThisWorkout, calculatedDistance);
          
          description = `${runMinutes}min run, ${walkMinutes}min walk (${intervals}x) - Target: ${calculatedDistance.toFixed(1)}km`;
        } else {
          // Final weeks: Continuous running building to goal
          const targetDistance = startingDistance + (progressRatio * (goalDistance - startingDistance));
          const runTimeHours = targetDistance / runningSpeed;
          const runMinutes = Math.round(runTimeHours * 60);
          
          calculatedDistance = targetDistance;
          description = `${runMinutes}min continuous run - Target: ${calculatedDistance.toFixed(1)}km`;
        }
        
        workouts.push({
          week,
          day,
          title: `Week ${week}, Day ${day}`,
          description,
          completed: false,
          skipped: false,
        });
      }
    }

    return workouts;
  };

  // Initialize workout plan when settings change or no workouts exist
  useEffect(() => {
    if (isInitialized) {
      // Always regenerate workouts when key settings change
      const newWorkouts = generateWorkoutPlan();
      setWorkoutData(newWorkouts);
    }
  }, [isInitialized, settings.programWeeks, settings.trainingDaysPerWeek, settings.goalDistance, settings.startingDistance, settings.walkingSpeed, settings.runningSpeed]);

  // Auto-schedule when start date changes
  useEffect(() => {
    if (isInitialized && workoutData.length > 0) {
      scheduleAllWorkouts();
    }
  }, [settings.startDate, isInitialized]);

  const updateWorkout = (week: number, day: number, updates: Partial<WorkoutDay>) => {
    setWorkoutData(prev => 
      prev.map(workout => 
        workout.week === week && workout.day === day 
          ? { ...workout, ...updates }
          : workout
      )
    );
  };

  const scheduleAllWorkouts = () => {
    const updatedWorkouts = [...workoutData];
    let currentDate = new Date(settings.startDate);
    
    for (let i = 0; i < updatedWorkouts.length; i++) {
      if (!updatedWorkouts[i].completed && !updatedWorkouts[i].skipped) {
        // Skip rest days
        while (settings.restDays.includes(currentDate.getDay())) {
          currentDate = addDays(currentDate, 1);
        }
        
        updatedWorkouts[i].scheduledDate = new Date(currentDate);
        currentDate = addDays(currentDate, 1);
      }
    }
    
    setWorkoutData(updatedWorkouts);
  };

  const skipWorkout = (week: number, day: number) => {
    setWorkoutData(prev => {
      const updatedWorkouts = [...prev];
      const skippedWorkoutIndex = updatedWorkouts.findIndex(w => w.week === week && w.day === day);
      
      if (skippedWorkoutIndex === -1) return prev;
      
      // Get the skipped workout
      const skippedWorkout = { ...updatedWorkouts[skippedWorkoutIndex] };
      
      // Remove the skipped workout from its current position
      updatedWorkouts.splice(skippedWorkoutIndex, 1);
      
      // Find the next available date after all currently scheduled workouts
      let nextAvailableDate = new Date();
      const scheduledDates = updatedWorkouts
        .filter(w => w.scheduledDate && !w.completed && !w.skipped)
        .map(w => w.scheduledDate!)
        .sort((a, b) => a.getTime() - b.getTime());
      
      if (scheduledDates.length > 0) {
        nextAvailableDate = addDays(scheduledDates[scheduledDates.length - 1], 1);
      }
      
      // Skip rest days for the new date
      while (settings.restDays.includes(nextAvailableDate.getDay())) {
        nextAvailableDate = addDays(nextAvailableDate, 1);
      }
      
      // Update the skipped workout's scheduled date and add it to the end
      skippedWorkout.scheduledDate = nextAvailableDate;
      updatedWorkouts.push(skippedWorkout);
      
      return updatedWorkouts;
    });
  };

  const updateSettings = (newSettings: ProgramSettings) => {
    setSettings(newSettings);
  };

  const completedWorkouts = workoutData.filter(w => w.completed).length;
  const totalWorkouts = workoutData.length;
  const progressPercentage = totalWorkouts > 0 ? (completedWorkouts / totalWorkouts) * 100 : 0;

  // Show social setup if no social user exists
  if (!currentUser) {
    return <SocialSetup />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent mb-2">
            Running Planner
          </h1>
          <p className="text-lg text-gray-600">Your personalized running journey starts here</p>
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
          <TabsList className="grid w-full grid-cols-5 bg-white/70 backdrop-blur-sm">
            <TabsTrigger value="workouts" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Workouts
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Progress
            </TabsTrigger>
            <TabsTrigger value="social" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              Social
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
              onSkipWorkout={skipWorkout}
              onScheduleAll={scheduleAllWorkouts}
              settings={settings}
            />
          </TabsContent>

          <TabsContent value="calendar">
            <CalendarView 
              workouts={workoutData}
              settings={settings}
            />
          </TabsContent>

          <TabsContent value="progress">
            <ProgressTracker 
              workouts={workoutData}
              settings={settings}
            />
          </TabsContent>

          <TabsContent value="social">
            <SocialDashboard />
          </TabsContent>

          <TabsContent value="settings">
            <SettingsPanel 
              settings={settings}
              onUpdateSettings={updateSettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
