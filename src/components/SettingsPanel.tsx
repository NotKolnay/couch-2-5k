
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar, Save } from "lucide-react";
import { ProgramSettings } from "@/pages/Index";
import { cn } from "@/lib/utils";

interface SettingsPanelProps {
  settings: ProgramSettings;
  onUpdateSettings: (settings: ProgramSettings) => void;
}

const SettingsPanel = ({ settings, onUpdateSettings }: SettingsPanelProps) => {
  const [localSettings, setLocalSettings] = useState<ProgramSettings>(settings);

  const handleSave = () => {
    onUpdateSettings(localSettings);
  };

  const handleRestDayToggle = (dayIndex: number, checked: boolean) => {
    const newRestDays = checked 
      ? [...localSettings.restDays, dayIndex]
      : localSettings.restDays.filter(day => day !== dayIndex);
    
    setLocalSettings(prev => ({
      ...prev,
      restDays: newRestDays.sort()
    }));
  };

  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-lg">
        <CardHeader>
          <CardTitle>Program Settings</CardTitle>
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
                    !localSettings.startDate && "text-muted-foreground"
                  )}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  {localSettings.startDate ? format(localSettings.startDate, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <CalendarComponent
                  mode="single"
                  selected={localSettings.startDate}
                  onSelect={(date) => 
                    setLocalSettings(prev => ({ ...prev, startDate: date || new Date() }))
                  }
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Distance Goals */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Starting Distance (km)</Label>
              <Input
                type="number"
                value={localSettings.startingDistance}
                onChange={(e) => 
                  setLocalSettings(prev => ({ ...prev, startingDistance: parseFloat(e.target.value) || 0 }))
                }
                min="0"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Goal Distance (km)</Label>
              <Input
                type="number"
                value={localSettings.goalDistance}
                onChange={(e) => 
                  setLocalSettings(prev => ({ ...prev, goalDistance: parseFloat(e.target.value) || 5 }))
                }
                min="1"
                step="0.1"
              />
            </div>
          </div>

          {/* Speed Settings */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Walking Speed (km/hr)</Label>
              <Input
                type="number"
                value={localSettings.walkingSpeed}
                onChange={(e) => 
                  setLocalSettings(prev => ({ ...prev, walkingSpeed: parseFloat(e.target.value) || 5 }))
                }
                min="1"
                step="0.1"
              />
            </div>
            <div className="space-y-2">
              <Label>Running Speed Goal (km/hr)</Label>
              <Input
                type="number"
                value={localSettings.runningSpeed}
                onChange={(e) => 
                  setLocalSettings(prev => ({ ...prev, runningSpeed: parseFloat(e.target.value) || 9 }))
                }
                min="1"
                step="0.1"
              />
            </div>
          </div>

          {/* Program Structure */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Program Duration (weeks)</Label>
              <Input
                type="number"
                value={localSettings.programWeeks}
                onChange={(e) => 
                  setLocalSettings(prev => ({ ...prev, programWeeks: parseInt(e.target.value) || 9 }))
                }
                min="1"
                max="52"
              />
            </div>
            <div className="space-y-2">
              <Label>Training Days per Week</Label>
              <Input
                type="number"
                value={localSettings.trainingDaysPerWeek}
                onChange={(e) => 
                  setLocalSettings(prev => ({ ...prev, trainingDaysPerWeek: parseInt(e.target.value) || 3 }))
                }
                min="1"
                max="7"
              />
            </div>
          </div>

          {/* Rest Days */}
          <div className="space-y-3">
            <Label>Rest Days</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {weekDays.map((day, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Checkbox
                    id={`rest-day-${index}`}
                    checked={localSettings.restDays.includes(index)}
                    onCheckedChange={(checked) => 
                      handleRestDayToggle(index, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={`rest-day-${index}`}
                    className="text-sm font-normal"
                  >
                    {day.slice(0, 3)}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Save Button */}
          <Button 
            onClick={handleSave}
            className="w-full"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default SettingsPanel;
