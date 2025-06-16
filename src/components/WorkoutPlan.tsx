
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { WorkoutDay, ProgramSettings } from "@/pages/Index";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface WorkoutPlanProps {
  workouts: WorkoutDay[];
  currentWeek: number;
  onUpdateWorkout: (week: number, day: number, updates: Partial<WorkoutDay>) => void;
  onPostponeWorkout: (week: number, day: number, newDate: Date) => void;
  settings: ProgramSettings;
}

const WorkoutPlan = ({ 
  workouts, 
  currentWeek, 
  onUpdateWorkout, 
  onPostponeWorkout,
  settings 
}: WorkoutPlanProps) => {
  const [selectedWeek, setSelectedWeek] = useState(currentWeek);
  const [postponeDate, setPostponeDate] = useState<Date>();

  const weeksData = Array.from({ length: 9 }, (_, i) => i + 1);
  const selectedWeekWorkouts = workouts.filter(w => w.week === selectedWeek);

  const handleCompleteWorkout = (workout: WorkoutDay, completed: boolean) => {
    onUpdateWorkout(workout.week, workout.day, {
      completed,
      completedDate: completed ? new Date() : undefined
    });
  };

  const handlePostpone = (workout: WorkoutDay, date: Date) => {
    onPostponeWorkout(workout.week, workout.day, date);
  };

  const getWorkoutStatus = (workout: WorkoutDay) => {
    if (workout.completed) return "completed";
    if (workout.scheduledDate && workout.scheduledDate > new Date()) return "scheduled";
    return "pending";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-green-100 text-green-800 border-green-200";
      case "scheduled": return "bg-blue-100 text-blue-800 border-blue-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Week Navigation */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Training Weeks</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 md:grid-cols-9 gap-2">
            {weeksData.map(week => {
              const weekWorkouts = workouts.filter(w => w.week === week);
              const completedCount = weekWorkouts.filter(w => w.completed).length;
              const isComplete = completedCount === weekWorkouts.length;
              const isCurrent = week === selectedWeek;
              
              return (
                <Button
                  key={week}
                  variant={isCurrent ? "default" : "outline"}
                  className={cn(
                    "relative",
                    isComplete && "bg-green-100 border-green-300 text-green-800",
                    isCurrent && "ring-2 ring-blue-500 ring-offset-2"
                  )}
                  onClick={() => setSelectedWeek(week)}
                >
                  Week {week}
                  {isComplete && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"></div>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected Week Workouts */}
      <div className="grid gap-4">
        <h3 className="text-xl font-semibold">Week {selectedWeek} Workouts</h3>
        {selectedWeekWorkouts.map(workout => {
          const status = getWorkoutStatus(workout);
          
          return (
            <Card key={`${workout.week}-${workout.day}`} className="bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <Checkbox
                      checked={workout.completed}
                      onCheckedChange={(checked) => 
                        handleCompleteWorkout(workout, checked as boolean)
                      }
                      className="mt-1"
                    />
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-lg">{workout.title}</h4>
                        <Badge className={getStatusColor(status)}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-3">{workout.description}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        {workout.scheduledDate && (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format(workout.scheduledDate, "MMM dd, yyyy")}
                          </div>
                        )}
                        {workout.completedDate && (
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            Completed {format(workout.completedDate, "MMM dd")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Calendar className="w-4 h-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Schedule Workout</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <p>Schedule "{workout.title}" for a specific date:</p>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start text-left font-normal",
                                  !postponeDate && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {postponeDate ? format(postponeDate, "PPP") : "Pick a date"}
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <CalendarComponent
                                mode="single"
                                selected={postponeDate}
                                onSelect={setPostponeDate}
                                initialFocus
                                className="p-3 pointer-events-auto"
                              />
                            </PopoverContent>
                          </Popover>
                          {postponeDate && (
                            <Button 
                              onClick={() => {
                                handlePostpone(workout, postponeDate);
                                setPostponeDate(undefined);
                              }}
                              className="w-full"
                            >
                              Schedule Workout
                            </Button>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="sm">
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WorkoutPlan;
