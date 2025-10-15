import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock, MessageCircle, UserPlus, Check, Shield, Info } from 'lucide-react';

interface CampaignSettingsProps {
    campaignSettings: any;
    updateCampaignSetting: (path: string, value: any) => void;
    handleSaveCampaignSettings: () => void;
    isSavingSettings: boolean;
    isDarkMode: boolean;
    timezones: any;
    isTimezonesLoading: boolean;
    safetyPresets: any;
    isPresetsLoading: boolean;
    applyPreset: (presetKey: string) => Promise<void>;
    isApplyingPreset: boolean;
}

const CampaignSettings: React.FC<CampaignSettingsProps> = ({
    campaignSettings,
    updateCampaignSetting,
    handleSaveCampaignSettings,
    isSavingSettings,
    isDarkMode,
    timezones,
    isTimezonesLoading,
    safetyPresets,
    isPresetsLoading,
    applyPreset,
    isApplyingPreset
}) => {
    return (
        <>
            {/* LinkedIn Delay Settings */}
            <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                <CardHeader>
                    <CardTitle className={`flex items-center ${isDarkMode ? 'text-white' : ''}`}>
                        <Clock className="h-5 w-5 mr-2" />
                        LinkedIn Delay Settings
                    </CardTitle>
                    <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                        Configure delays between LinkedIn actions to maintain natural behavior
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Safety Recommendation Banner */}
                    <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                        <div className="flex items-start gap-3">
                            <Shield className={`h-5 w-5 mt-0.5 flex-shrink-0 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                            <div className="flex-1">
                                <h4 className={`font-semibold text-sm mb-1 ${isDarkMode ? 'text-blue-300' : 'text-blue-900'}`}>
                                    Start Conservative: Recommended Delays
                                </h4>
                                <p className={`text-sm ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>
                                    We <span className="font-medium">strongly recommend starting with conservative delays</span> between LinkedIn actions.
                                    Use <span className="font-medium">20 minutes for invitations</span> and <span className="font-medium">5-10 minutes for messages</span>.
                                    This maintains natural behavior patterns and protects your LinkedIn account from restrictions.
                                </p>
                                <div className={`mt-2 text-xs ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                                    <p className="font-medium">💡 Best Practice:</p>
                                    <ul className="list-disc list-inside ml-2 mt-1 space-y-0.5">
                                        <li>Invitations: Start with 20-minute minimum delays</li>
                                        <li>Messages: Start with 5-10 minute delays (messages are less restricted)</li>
                                        <li>Keep these delays for the first 2-4 weeks to establish safe patterns</li>
                                        <li>Only reduce gradually if no issues occur</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Invitations Section */}
                    <div className="space-y-4">
                        <div className="flex items-center mb-3">
                            <UserPlus className="h-4 w-4 mr-2 text-blue-500" />
                            <h4 className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Connection Invitations
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        Minimum Delay (minutes)
                                    </Label>
                                    {campaignSettings?.delaySettings?.invitations?.minDelay === 20 * 60000 && (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                            <Check className="h-3 w-3 mr-1" />
                                            Recommended
                                        </Badge>
                                    )}
                                </div>
                                <Input
                                    type="number"
                                    min="5"
                                    value={campaignSettings?.delaySettings?.invitations?.minDelay ? Math.floor(campaignSettings.delaySettings.invitations.minDelay / 60000) : 20}
                                    onChange={(e) => updateCampaignSetting('delaySettings.invitations.minDelay', parseInt(e.target.value) * 60000)}
                                    className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}
                                />
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Info className="h-3 w-3 inline mr-1" />
                                    Recommended: 20 minutes
                                </p>
                            </div>
                            <div>
                                <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                    Maximum Delay (minutes)
                                </Label>
                                <Input
                                    type="number"
                                    min="5"
                                    value={campaignSettings?.delaySettings?.invitations?.maxDelay ? Math.floor(campaignSettings.delaySettings.invitations.maxDelay / 60000) : 30}
                                    onChange={(e) => updateCampaignSetting('delaySettings.invitations.maxDelay', parseInt(e.target.value) * 60000)}
                                    className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}
                                />
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Should be higher than minimum delay
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator className={isDarkMode ? 'bg-gray-700' : 'bg-gray-200'} />

                    {/* Messages Section */}
                    <div className="space-y-4">
                        <div className="flex items-center mb-3">
                            <MessageCircle className="h-4 w-4 mr-2 text-green-500" />
                            <h4 className={`text-md font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                Messages
                            </h4>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        Minimum Delay (minutes)
                                    </Label>
                                    {campaignSettings?.delaySettings?.messages?.minDelay >= 5 * 60000 && campaignSettings?.delaySettings?.messages?.minDelay <= 10 * 60000 && (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                                            <Check className="h-3 w-3 mr-1" />
                                            Recommended
                                        </Badge>
                                    )}
                                </div>
                                <Input
                                    type="number"
                                    min="1"
                                    value={campaignSettings?.delaySettings?.messages?.minDelay ? Math.floor(campaignSettings.delaySettings.messages.minDelay / 60000) : 5}
                                    onChange={(e) => updateCampaignSetting('delaySettings.messages.minDelay', parseInt(e.target.value) * 60000)}
                                    className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}
                                />
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    <Info className="h-3 w-3 inline mr-1" />
                                    Recommended: 5-10 minutes
                                </p>
                            </div>
                            <div>
                                <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                    Maximum Delay (minutes)
                                </Label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={campaignSettings?.delaySettings?.messages?.maxDelay ? Math.floor(campaignSettings.delaySettings.messages.maxDelay / 60000) : 10}
                                    onChange={(e) => updateCampaignSetting('delaySettings.messages.maxDelay', parseInt(e.target.value) * 60000)}
                                    className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}
                                />
                                <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Should be higher than minimum delay
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Working Hours Settings */}
            <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                <CardHeader>
                    <CardTitle className={isDarkMode ? 'text-white' : ''}>Working Hours</CardTitle>
                    <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                        Configure when campaigns should be active
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                Enable Working Hours
                            </Label>
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Only run campaigns during specified hours
                            </p>
                        </div>
                        <Switch
                            checked={campaignSettings?.workingHours?.enabled || false}
                            onCheckedChange={(checked) => updateCampaignSetting('workingHours.enabled', checked)}
                        />
                    </div>

                    {campaignSettings?.workingHours?.enabled && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        Start Time (24h format)
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={campaignSettings?.workingHours?.start || 8}
                                        onChange={(e) => updateCampaignSetting('workingHours.start', parseInt(e.target.value))}
                                        className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}
                                    />
                                </div>
                                <div>
                                    <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                        End Time (24h format)
                                    </Label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="23"
                                        value={campaignSettings?.workingHours?.end || 20}
                                        onChange={(e) => updateCampaignSetting('workingHours.end', parseInt(e.target.value))}
                                        className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}
                                    />
                                </div>
                            </div>

                            <div>
                                <Label className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                                    Timezone
                                </Label>
                                <Select
                                    value={campaignSettings?.workingHours?.timezone || 'America/New_York'}
                                    onValueChange={(value) => updateCampaignSetting('workingHours.timezone', value)}
                                >
                                    <SelectTrigger className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {isTimezonesLoading ? (
                                            <SelectItem value="loading" disabled>Loading timezones...</SelectItem>
                                        ) : timezones ? (
                                            <>
                                                {/* Popular Timezones */}
                                                <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Popular
                                                </div>
                                                {timezones.popular?.map((tz: any) => (
                                                    <SelectItem key={tz.value} value={tz.value}>
                                                        {tz.label} ({tz.offset})
                                                    </SelectItem>
                                                ))}

                                                {/* Regional Timezones */}
                                                {timezones.regions && Object.entries(timezones.regions).map(([region, zones]: [string, any]) => (
                                                    <div key={region}>
                                                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider border-t">
                                                            {region}
                                                        </div>
                                                        {zones.map((zone: string) => (
                                                            <SelectItem key={zone} value={zone}>
                                                                {zone.replace(/_/g, ' ')}
                                                            </SelectItem>
                                                        ))}
                                                    </div>
                                                ))}
                                            </>
                                        ) : (
                                            <>
                                                {/* Fallback to hardcoded popular timezones if API fails */}
                                                <SelectItem value="America/New_York">Eastern Time (US)</SelectItem>
                                                <SelectItem value="America/Chicago">Central Time (US)</SelectItem>
                                                <SelectItem value="America/Denver">Mountain Time (US)</SelectItem>
                                                <SelectItem value="America/Los_Angeles">Pacific Time (US)</SelectItem>
                                                <SelectItem value="Europe/London">Greenwich Mean Time (UK)</SelectItem>
                                                <SelectItem value="Europe/Berlin">Central European Time</SelectItem>
                                                <SelectItem value="Asia/Tokyo">Japan Standard Time</SelectItem>
                                                <SelectItem value="Australia/Sydney">Australian Eastern Time</SelectItem>
                                            </>
                                        )}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Enable Weekends
                                    </Label>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                        Run campaigns on weekends
                                    </p>
                                </div>
                                <Switch
                                    checked={campaignSettings?.workingHours?.weekendsEnabled || false}
                                    onCheckedChange={(checked) => updateCampaignSetting('workingHours.weekendsEnabled', checked)}
                                />
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Safety Preset */}
            <Card className={isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white'}>
                <CardHeader>
                    <CardTitle className={isDarkMode ? 'text-white' : ''}>Safety Preset</CardTitle>
                    <CardDescription className={isDarkMode ? 'text-gray-400' : ''}>
                        Choose a preset for campaign safety settings
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isPresetsLoading ? (
                        <div className="flex items-center justify-center py-4">
                            <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${isDarkMode ? 'border-white' : 'border-black'}`}></div>
                            <span className="ml-2">Loading presets...</span>
                        </div>
                    ) : safetyPresets ? (
                        <>
                            {/* Preset Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {Object.entries(safetyPresets).map(([key, preset]: [string, any]) => (
                                    <div
                                        key={key}
                                        className={`p-3 rounded-lg border transition-all ${isApplyingPreset
                                            ? 'cursor-not-allowed opacity-50'
                                            : 'cursor-pointer hover:shadow-md'
                                            } ${campaignSettings?.safetyPreset === key
                                                ? isDarkMode
                                                    ? 'border-blue-500 bg-blue-900/20'
                                                    : 'border-blue-500 bg-blue-50'
                                                : isDarkMode
                                                    ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                                                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                            }`}
                                        onClick={() => !isApplyingPreset && applyPreset(key)}
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center">
                                                <span className="text-lg mr-2">{preset.icon}</span>
                                                <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {preset.name}
                                                </h4>
                                            </div>
                                            {campaignSettings?.safetyPreset === key && (
                                                <Check className="h-4 w-4 text-blue-500" />
                                            )}
                                        </div>
                                        <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                            {preset.description}
                                        </p>
                                        <div className={`text-xs mt-2 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                                            Invitations: {Math.floor(preset.delaySettings.invitations.minDelay / 60000)}-{Math.floor(preset.delaySettings.invitations.maxDelay / 60000)}min
                                            <br />
                                            Messages: {preset.delaySettings.messages.unit === 'seconds'
                                                ? `${Math.floor(preset.delaySettings.messages.minDelay / 1000)}-${Math.floor(preset.delaySettings.messages.maxDelay / 1000)}s`
                                                : `${Math.floor(preset.delaySettings.messages.minDelay / 60000)}-${Math.floor(preset.delaySettings.messages.maxDelay / 60000)}min`
                                            }
                                        </div>
                                    </div>
                                ))}

                                {/* Custom Option */}
                                <div
                                    className={`p-3 rounded-lg border transition-all ${isApplyingPreset
                                        ? 'cursor-not-allowed opacity-50'
                                        : 'cursor-pointer hover:shadow-md'
                                        } ${campaignSettings?.safetyPreset === 'custom' || !campaignSettings?.safetyPreset
                                            ? isDarkMode
                                                ? 'border-purple-500 bg-purple-900/20'
                                                : 'border-purple-500 bg-purple-50'
                                            : isDarkMode
                                                ? 'border-gray-600 bg-gray-800 hover:border-gray-500'
                                                : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                                        }`}
                                    onClick={() => !isApplyingPreset && updateCampaignSetting('safetyPreset', 'custom')}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center">
                                            <span className="text-lg mr-2">⚙️</span>
                                            <h4 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                Custom
                                            </h4>
                                        </div>
                                        {(campaignSettings?.safetyPreset === 'custom' || !campaignSettings?.safetyPreset) && (
                                            <Check className="h-4 w-4 text-purple-500" />
                                        )}
                                    </div>
                                    <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Configure your own custom delay settings
                                    </p>
                                </div>
                            </div>

                            {/* Loading State */}
                            {isApplyingPreset && (
                                <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-blue-900/20 border-blue-500' : 'bg-blue-50 border-blue-200'} border`}>
                                    <div className="flex items-center">
                                        <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${isDarkMode ? 'border-blue-400' : 'border-blue-600'} mr-2`}></div>
                                        <p className={`text-sm ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                            Applying preset settings...
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Current Status */}
                            <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                    Current preset:
                                    <Badge variant="secondary" className="ml-2">
                                        {campaignSettings?.safetyPreset ?
                                            safetyPresets[campaignSettings.safetyPreset]?.name || campaignSettings.safetyPreset
                                            : 'Custom'
                                        }
                                    </Badge>
                                </p>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Fallback to simple dropdown if API fails */}
                            <Select
                                value={campaignSettings?.safetyPreset || 'custom'}
                                onValueChange={(value) => updateCampaignSetting('safetyPreset', value)}
                            >
                                <SelectTrigger className={isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : ''}>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="conservative">Conservative</SelectItem>
                                    <SelectItem value="balanced">Balanced</SelectItem>
                                    <SelectItem value="aggressive">Aggressive</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                            <p className={`text-xs mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Current preset: <Badge variant="secondary">{campaignSettings?.safetyPreset || 'custom'}</Badge>
                            </p>
                        </>
                    )}
                </CardContent>
                <CardFooter>
                    <Button
                        onClick={handleSaveCampaignSettings}
                        disabled={isSavingSettings}
                        className="w-full"
                    >
                        {isSavingSettings ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Saving...
                            </>
                        ) : (
                            <>
                                <Check className="h-4 w-4 mr-2" />
                                Save Settings
                            </>
                        )}
                    </Button>
                </CardFooter>
            </Card>
        </>
    );
};

export default CampaignSettings;
