
import { useState, useEffect } from "react";
import WorkoutPlan from "@/components/WorkoutPlan";
import ProgressTracker from "@/components/ProgressTracker";
import SettingsPanel from "@/components/SettingsPanel";
import CalendarView from "@/components/CalendarView";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Settings, Download, Play, CalendarDays } from "lucide-react";
import { addDays, format } from "date-fns";

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
    const distanceProgression = (goalDistance - startingDistance) / totalWorkouts;
    
    for (let week = 1; week <= programWeeks; week++) {
      const weekProgress = (week - 1) / (programWeeks - 1);
      
      for (let day = 1; day <= trainingDaysPerWeek; day++) {
        const workoutIndex = ((week - 1) * trainingDaysPerWeek) + day - 1;
        const currentDistance = startingDistance + (distanceProgression * (workoutIndex + 1));
        
        let description = "";
        
        if (week <= Math.ceil(programWeeks * 0.4)) {
          // Early weeks: Walk/Run intervals with increasing run time
          const runSeconds = Math.ceil(60 + (weekProgress * 240)); // 60s to 300s
          const walkSeconds = Math.ceil(120 - (weekProgress * 60)); // 120s to 60s
          const intervals = Math.ceil(8 - (weekProgress * 3)); // 8 to 5 intervals
          const estimatedTime = ((runSeconds + walkSeconds) * intervals) / 60; // in minutes
          const adjustedDistance = Math.max(currentDistance, (estimatedTime / 60) * ((walkingSpeed + runningSpeed) / 2));
          description = `${runSeconds}s run, ${walkSeconds}s walk (${intervals}x) - Target: ${adjustedDistance.toFixed(1)}km`;
        } else if (week <= Math.ceil(programWeeks * 0.7)) {
          // Middle weeks: Longer intervals
          const runMinutes = Math.ceil(3 + (weekProgress * 8)); // 3 to 11 minutes
          const walkMinutes = Math.ceil(3 - (weekProgress * 2)); // 3 to 1 minutes
          const intervals = 3;
          const totalRunTime = runMinutes * intervals;
          const totalWalkTime = walkMinutes * intervals;
          const estimatedDistance = (totalRunTime / 60) * runningSpeed + (totalWalkTime / 60) * walkingSpeed;
          const adjustedDistance = Math.max(currentDistance, estimatedDistance);
          description = `${runMinutes}min run, ${walkMinutes}min walk (${intervals}x) - Target: ${adjustedDistance.toFixed(1)}km`;
        } else {
          // Final weeks: Continuous running with time to reach goal
          const targetTime = (currentDistance / runningSpeed) * 60; // minutes needed to reach distance at running speed
          const runMinutes = Math.ceil(targetTime);
          description = `${runMinutes}min continuous run - Target: ${currentDistance.toFixed(1)}km`;
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

  // Initialize workout plan only when no saved workouts exist or key settings changed
  useEffect(() => {
    if (isInitialized && workoutData.length === 0) {
      const initialWorkouts = generateWorkoutPlan();
      setWorkoutData(initialWorkouts);
    }
  }, [isInitialized]);

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
    // Mark the workout as skipped and remove its scheduled date
    updateWorkout(week, day, { skipped: true, scheduledDate: undefined });
    
    // Reschedule all remaining workouts
    setTimeout(() => {
      rescheduleFromWorkout(week, day);
    }, 100);
  };

  const rescheduleFromWorkout = (fromWeek: number, fromDay: number) => {
    const workoutIndex = workoutData.findIndex(w => w.week === fromWeek && w.day === fromDay);
    if (workoutIndex === -1) return;
    
    setWorkoutData(prev => {
      const updatedWorkouts = [...prev];
      
      // Find the last scheduled date before the skipped workout
      let currentDate = new Date();
      for (let i = 0; i < workoutIndex; i++) {
        if (updatedWorkouts[i].scheduledDate && !updatedWorkouts[i].skipped) {
          currentDate = new Date(updatedWorkouts[i].scheduledDate);
        }
      }
      
      // Start from the day after the last scheduled workout
      currentDate = addDays(currentDate, 1);
      
      // Reschedule all workouts from the skipped one onward
      for (let i = workoutIndex + 1; i < updatedWorkouts.length; i++) {
        if (!updatedWorkouts[i].completed && !updatedWorkouts[i].skipped) {
          while (settings.restDays.includes(currentDate.getDay())) {
            currentDate = addDays(currentDate, 1);
          }
          updatedWorkouts[i].scheduledDate = new Date(currentDate);
          currentDate = addDays(currentDate, 1);
        }
      }
      
      return updatedWorkouts;
    });
  };

  const updateSettings = (newSettings: ProgramSettings) => {
    const keySettingsChanged = 
      newSettings.programWeeks !== settings.programWeeks ||
      newSettings.trainingDaysPerWeek !== settings.trainingDaysPerWeek ||
      newSettings.goalDistance !== settings.goalDistance ||
      newSettings.startingDistance !== settings.startingDistance ||
      newSettings.walkingSpeed !== settings.walkingSpeed ||
      newSettings.runningSpeed !== settings.runningSpeed;
    
    setSettings(newSettings);
    
    // Only regenerate workouts if key settings changed
    if (keySettingsChanged) {
      const newWorkouts = generateWorkoutPlan();
      setWorkoutData(newWorkouts);
    }
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
          <TabsList className="grid w-full grid-cols-4 bg-white/70 backdrop-blur-sm">
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
