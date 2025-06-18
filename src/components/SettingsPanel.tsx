
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { Calendar, Save, Clock, Target, Calendar as CalendarIcon, MapPin, Gauge } from "lucide-react";
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
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
          Program Settings
        </h2>
        <p className="text-gray-600">Customize your running program to match your goals and preferences</p>
      </div>

      {/* Program Timeline */}
      <Card className="bg-gradient-to-r from-blue-50 to-green-50 border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-white/50 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-3">
            <CalendarIcon className="w-6 h-6 text-blue-600" />
            Program Timeline
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Start Date */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Program Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal h-12 border-2 hover:border-blue-300 transition-colors",
                      !localSettings.startDate && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-3 h-5 w-5 text-blue-600" />
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

            {/* Program Duration */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Program Duration (weeks)</Label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600" />
                <Input
                  type="number"
                  value={localSettings.programWeeks}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ ...prev, programWeeks: parseInt(e.target.value) || 9 }))
                  }
                  min="1"
                  max="52"
                  className="pl-11 h-12 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm font-semibold text-gray-700">Training Days per Week</Label>
            <div className="relative">
              <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-600" />
              <Input
                type="number"
                value={localSettings.trainingDaysPerWeek}
                onChange={(e) => 
                  setLocalSettings(prev => ({ ...prev, trainingDaysPerWeek: parseInt(e.target.value) || 3 }))
                }
                min="1"
                max="7"
                className="pl-11 h-12 border-2 hover:border-blue-300 focus:border-blue-500 transition-colors"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Distance Goals */}
      <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-white/50 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-green-600" />
            Distance Goals
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Starting Distance (km)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                <Input
                  type="number"
                  value={localSettings.startingDistance}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ ...prev, startingDistance: parseFloat(e.target.value) || 0 }))
                  }
                  min="0"
                  step="0.1"
                  className="pl-11 h-12 border-2 hover:border-green-300 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Goal Distance (km)</Label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-green-600" />
                <Input
                  type="number"
                  value={localSettings.goalDistance}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ ...prev, goalDistance: parseFloat(e.target.value) || 5 }))
                  }
                  min="1"
                  step="0.1"
                  className="pl-11 h-12 border-2 hover:border-green-300 focus:border-green-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Speed Settings */}
      <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-white/50 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-3">
            <Gauge className="w-6 h-6 text-purple-600" />
            Speed Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Walking Speed (km/hr)</Label>
              <div className="relative">
                <Gauge className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-600" />
                <Input
                  type="number"
                  value={localSettings.walkingSpeed}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ ...prev, walkingSpeed: parseFloat(e.target.value) || 5 }))
                  }
                  min="1"
                  step="0.1"
                  className="pl-11 h-12 border-2 hover:border-purple-300 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700">Running Speed Goal (km/hr)</Label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-600" />
                <Input
                  type="number"
                  value={localSettings.runningSpeed}
                  onChange={(e) => 
                    setLocalSettings(prev => ({ ...prev, runningSpeed: parseFloat(e.target.value) || 9 }))
                  }
                  min="1"
                  step="0.1"
                  className="pl-11 h-12 border-2 hover:border-purple-300 focus:border-purple-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rest Days */}
      <Card className="bg-gradient-to-r from-orange-50 to-yellow-50 border-0 shadow-xl overflow-hidden">
        <CardHeader className="bg-white/50 backdrop-blur-sm">
          <CardTitle className="flex items-center gap-3">
            <Clock className="w-6 h-6 text-orange-600" />
            Rest Days
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Select which days of the week you want to rest</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {weekDays.map((day, index) => (
                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-white/60 hover:bg-white/80 transition-colors">
                  <Checkbox
                    id={`rest-day-${index}`}
                    checked={localSettings.restDays.includes(index)}
                    onCheckedChange={(checked) => 
                      handleRestDayToggle(index, checked as boolean)
                    }
                    className="border-2 border-orange-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500"
                  />
                  <Label 
                    htmlFor={`rest-day-${index}`}
                    className="text-sm font-medium cursor-pointer"
                  >
                    {day}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-center">
        <Button 
          onClick={handleSave}
          className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700 text-white px-8 py-3 h-14 text-lg font-semibold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-200"
          size="lg"
        >
          <Save className="w-5 h-5 mr-3" />
          Save Settings
        </Button>
      </div>
    </div>
  );
};

export default SettingsPanel;
