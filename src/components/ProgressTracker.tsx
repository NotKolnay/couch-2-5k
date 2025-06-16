
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Calendar, CheckCircle, Clock } from "lucide-react";
import { format, startOfWeek, addDays } from "date-fns";
import { WorkoutDay, ProgramSettings } from "@/pages/Index";

interface ProgressTrackerProps {
  workouts: WorkoutDay[];
  settings: ProgramSettings;
}

const ProgressTracker = ({ workouts, settings }: ProgressTrackerProps) => {
  const completedWorkouts = workouts.filter(w => w.completed);
  const totalWorkouts = workouts.length;
  const progressPercentage = totalWorkouts > 0 ? (completedWorkouts.length / totalWorkouts) * 100 : 0;

  // Calculate weekly progress
  const weeklyProgress = Array.from({ length: settings.programWeeks }, (_, i) => {
    const week = i + 1;
    const weekWorkouts = workouts.filter(w => w.week === week);
    const weekCompleted = weekWorkouts.filter(w => w.completed).length;
    return {
      week,
      total: weekWorkouts.length,
      completed: weekCompleted,
      percentage: weekWorkouts.length > 0 ? (weekCompleted / weekWorkouts.length) * 100 : 0
    };
  });

  const generatePDF = async () => {
    // Create a simple text-based report for PDF generation
    const reportData = {
      programStart: settings.startDate,
      goal: settings.goalDistance,
      totalWorkouts,
      completedWorkouts: completedWorkouts.length,
      progressPercentage: Math.round(progressPercentage),
      weeklyBreakdown: weeklyProgress,
      completedList: completedWorkouts.map(w => ({
        title: w.title,
        completedDate: w.completedDate ? format(w.completedDate, "PPP") : "Unknown",
        description: w.description
      }))
    };

    // Simple text-based PDF content
    const pdfContent = `
COUCH TO ${settings.goalDistance}K PROGRESS REPORT
Generated on: ${format(new Date(), "PPP")}

PROGRAM OVERVIEW
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Program Start Date: ${format(settings.startDate, "PPP")}
Goal: ${settings.goalDistance}K
Overall Progress: ${reportData.progressPercentage}% (${reportData.completedWorkouts}/${reportData.totalWorkouts} workouts)

WEEKLY BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${weeklyProgress.map(w => 
  `Week ${w.week}: ${w.completed}/${w.total} workouts (${Math.round(w.percentage)}%)`
).join('\n')}

COMPLETED WORKOUTS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
${reportData.completedList.map(w => 
  `${w.title} - Completed: ${w.completedDate}\n  ${w.description}`
).join('\n\n')}
    `;

    // Create and download as text file (simple PDF alternative)
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `couch-to-${settings.goalDistance}k-progress-${format(new Date(), 'yyyy-MM-dd')}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Overall Progress */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Program Completion</span>
              <span className="text-sm text-gray-600">{completedWorkouts.length}/{totalWorkouts} workouts</span>
            </div>
            <Progress value={progressPercentage} className="h-3" />
            <div className="text-center">
              <span className="text-2xl font-bold text-blue-600">{Math.round(progressPercentage)}%</span>
              <span className="text-gray-600 ml-2">Complete</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Breakdown */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Weekly Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {weeklyProgress.map(week => (
              <div key={week.week} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="font-semibold text-blue-600">{week.week}</span>
                  </div>
                  <div>
                    <div className="font-medium">Week {week.week}</div>
                    <div className="text-sm text-gray-600">{week.completed}/{week.total} workouts</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-lg">{Math.round(week.percentage)}%</div>
                  <Progress value={week.percentage} className="w-20 h-2 mt-1" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-purple-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {completedWorkouts
              .sort((a, b) => (b.completedDate?.getTime() || 0) - (a.completedDate?.getTime() || 0))
              .slice(0, 5)
              .map((workout, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <div className="font-medium">{workout.title}</div>
                    <div className="text-sm text-gray-600">
                      {workout.completedDate ? format(workout.completedDate, "PPP") : "Recently completed"}
                    </div>
                  </div>
                </div>
              ))}
            {completedWorkouts.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                No workouts completed yet. Start your first workout to see your progress here!
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Export Button */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-orange-600" />
            Export Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Download a detailed report of your progress through the Couch to {settings.goalDistance}K program.
          </p>
          <Button onClick={generatePDF} className="w-full" size="lg">
            <Download className="w-4 h-4 mr-2" />
            Download Progress Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProgressTracker;
