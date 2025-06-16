
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings, Calendar as CalendarIcon, Target, Clock } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ProgramSettings } from "@/pages/Index";

interface SettingsPanelProps {
  settings: ProgramSettings;
  onUpdateSettings: (settings: ProgramSettings) => void;
}

const SettingsPanel = ({ settings, onUpdateSettings }: SettingsPanelProps) => {
  const [localSettings, setLocalSettings] = useState<ProgramSettings>(settings);
  const [startDate, setStartDate] = useState<Date>(settings.startDate);

  const timeGoalOptions = [
    { value: "20min", label: "20 minutes" },
    { value: "25min", label: "25 minutes" },
    { value: "30min", label: "30 minutes" },
    { value: "35min", label: "35 minutes" },
    { value: "40min", label: "40 minutes" }
  ];

  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const handleSaveSettings = () => {
    const updatedSettings = {
      ...localSettings,
      startDate
    };
    onUpdateSettings(updatedSettings);
  };

  const handleRestDayToggle = (dayIndex: number, enabled: boolean) => {
    const newRestDays = enabled 
      ? [...localSettings.restDays, dayIndex].sort()
      : localSettings.restDays.filter(day => day !== dayIndex);
    
    setLocalSettings(prev => ({
      ...prev,
      restDays: newRestDays
    }));
  };

  return (
    <div className="space-y-6">
      {/* Program Settings */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-600" />
            Program Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Goal Distance in KM */}
          <div className="space-y-2">
            <Label htmlFor="goal-distance">Goal Distance (Kilometers)</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="goal-distance"
                type="number"
                min="1"
                max="42"
                step="0.5"
                value={localSettings.goalDistance}
                onChange={(e) => setLocalSettings(prev => ({ 
                  ...prev, 
                  goalDistance: parseFloat(e.target.value) || 5 
                }))}
                className="w-24"
              />
              <span className="text-sm text-gray-600">km</span>
            </div>
            <p className="text-xs text-gray-500">Choose your target distance (e.g., 5K, 10K, etc.)</p>
          </div>

          {/* Program Duration */}
          <div className="space-y-2">
            <Label htmlFor="program-weeks">Program Duration (Weeks)</Label>
            <Select 
              value={localSettings.programWeeks.toString()} 
              onValueChange={(value) => setLocalSettings(prev => ({ 
                ...prev, 
                programWeeks: parseInt(value) 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select program length" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6">6 weeks</SelectItem>
                <SelectItem value="8">8 weeks</SelectItem>
                <SelectItem value="9">9 weeks (classic)</SelectItem>
                <SelectItem value="12">12 weeks</SelectItem>
                <SelectItem value="16">16 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Training Days Per Week */}
          <div className="space-y-2">
            <Label htmlFor="training-days">Training Days Per Week</Label>
            <Select 
              value={localSettings.trainingDaysPerWeek.toString()} 
              onValueChange={(value) => setLocalSettings(prev => ({ 
                ...prev, 
                trainingDaysPerWeek: parseInt(value) 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select training frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 days per week</SelectItem>
                <SelectItem value="3">3 days per week</SelectItem>
                <SelectItem value="4">4 days per week</SelectItem>
                <SelectItem value="5">5 days per week</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Time Goal */}
          <div className="space-y-2">
            <Label htmlFor="goal-time">Target Time (Optional)</Label>
            <Select 
              value={localSettings.goalTime || "none"} 
              onValueChange={(value) => setLocalSettings(prev => ({ 
                ...prev, 
                goalTime: value === "none" ? undefined : value 
              }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select target completion time" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No specific time goal</SelectItem>
                {timeGoalOptions.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-green-600" />
            Schedule Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Start Date */}
          <div className="space-y-2">
            <Label>Program Start Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => date && setStartDate(date)}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          <Separator />

          {/* Rest Days */}
          <div className="space-y-4">
            <Label>Rest Days</Label>
            <p className="text-sm text-gray-600">
              Select which days of the week you prefer to rest. The program will automatically schedule workouts around these days.
            </p>
            <div className="grid grid-cols-2 gap-3">
              {dayNames.map((day, index) => (
                <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <Label htmlFor={`rest-day-${index}`} className="cursor-pointer">
                    {day}
                  </Label>
                  <Switch
                    id={`rest-day-${index}`}
                    checked={localSettings.restDays.includes(index)}
                    onCheckedChange={(checked) => handleRestDayToggle(index, checked)}
                  />
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-purple-600" />
            Advanced Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email Reminders</Label>
                <p className="text-sm text-gray-600">Get reminded about upcoming workouts</p>
              </div>
              <Switch />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Auto-reschedule</Label>
                <p className="text-sm text-gray-600">Automatically adjust schedule when you miss workouts</p>
              </div>
              <Switch defaultChecked />
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label>Weather Integration</Label>
                <p className="text-sm text-gray-600">Get weather-based workout suggestions</p>
              </div>
              <Switch />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Card className="bg-gradient-to-r from-blue-500 to-green-500 text-white border-0 shadow-lg">
        <CardContent className="p-6">
          <Button 
            onClick={handleSaveSettings}
            className="w-full bg-white text-blue-600 hover:bg-gray-100"
            size="lg"
          >
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
