
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle, SkipForward, Clock } from "lucide-react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { WorkoutDay, ProgramSettings } from "@/pages/Index";
import { cn } from "@/lib/utils";

interface CalendarViewProps {
  workouts: WorkoutDay[];
  settings: ProgramSettings;
}

const CalendarView = ({ workouts, settings }: CalendarViewProps) => {
  const currentDate = new Date();
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const getWorkoutForDate = (date: Date) => {
    return workouts.find(workout => 
      workout.scheduledDate && isSameDay(workout.scheduledDate, date)
    );
  };

  const getWorkoutStatusIcon = (workout: WorkoutDay) => {
    if (workout.completed) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (workout.skipped) return <SkipForward className="w-4 h-4 text-yellow-600" />;
    return <Clock className="w-4 h-4 text-blue-600" />;
  };

  const getWorkoutStatusColor = (workout: WorkoutDay) => {
    if (workout.completed) return "bg-green-100 text-green-800 border-green-200";
    if (workout.skipped) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-blue-100 text-blue-800 border-blue-200";
  };

  // Get days of the week starting with Sunday
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Calculate the starting day offset
  const firstDayOfMonth = monthStart.getDay();
  const paddingDays = Array.from({ length: firstDayOfMonth }, (_, i) => null);

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Workout Calendar - {format(currentDate, 'MMMM yyyy')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-2">
            {/* Week day headers */}
            {weekDays.map(day => (
              <div key={day} className="p-2 text-center font-semibold text-gray-600 text-sm">
                {day}
              </div>
            ))}
            
            {/* Padding days for month start */}
            {paddingDays.map((_, index) => (
              <div key={`padding-${index}`} className="p-2 h-24"></div>
            ))}
            
            {/* Days of the month */}
            {daysInMonth.map(date => {
              const workout = getWorkoutForDate(date);
              const isRestDay = settings.restDays.includes(date.getDay());
              
              return (
                <div
                  key={date.toISOString()}
                  className={cn(
                    "p-2 h-24 border rounded-lg relative",
                    isToday(date) && "bg-blue-50 border-blue-200",
                    isRestDay && !workout && "bg-gray-50",
                    workout && "bg-white shadow-sm"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isToday(date) && "text-blue-600"
                  )}>
                    {format(date, 'd')}
                  </div>
                  
                  {isRestDay && !workout && (
                    <div className="text-xs text-gray-500">Rest day</div>
                  )}
                  
                  {workout && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        {getWorkoutStatusIcon(workout)}
                        <span className="text-xs font-medium">
                          W{workout.week}D{workout.day}
                        </span>
                      </div>
                      <Badge className={cn("text-xs px-1 py-0.5", getWorkoutStatusColor(workout))}>
                        {workout.completed ? 'Done' : workout.skipped ? 'Skipped' : 'Planned'}
                      </Badge>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg">Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <SkipForward className="w-4 h-4 text-yellow-600" />
              <span className="text-sm">Skipped</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-sm">Scheduled</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 rounded"></div>
              <span className="text-sm">Rest Day</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upcoming Workouts */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Upcoming Workouts</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {workouts
              .filter(w => w.scheduledDate && w.scheduledDate >= new Date() && !w.completed && !w.skipped)
              .sort((a, b) => (a.scheduledDate?.getTime() || 0) - (b.scheduledDate?.getTime() || 0))
              .slice(0, 5)
              .map((workout, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div>
                    <div className="font-medium">{workout.title}</div>
                    <div className="text-sm text-gray-600">{workout.description}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {workout.scheduledDate ? format(workout.scheduledDate, "MMM dd") : "TBD"}
                    </div>
                    <div className="text-xs text-gray-500">
                      {workout.scheduledDate ? format(workout.scheduledDate, "EEEE") : ""}
                    </div>
                  </div>
                </div>
              ))}
            {workouts.filter(w => w.scheduledDate && w.scheduledDate >= new Date() && !w.completed && !w.skipped).length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No upcoming workouts scheduled. Use the "Schedule All" button to automatically plan your workouts!
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalendarView;
