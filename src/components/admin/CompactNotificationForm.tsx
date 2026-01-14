'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { toast } from 'sonner';
import {
  Send,
  Users,
  BookOpen,
  GraduationCap,
  Building2,
  AlertCircle,
  Info,
  Loader2,
  Mail,
  Smartphone,
  Bell,
  ChevronDown,
  X,
} from 'lucide-react';
import type { NotificationScope, NotificationCategory, NotificationPriority, CreateNotificationRequest } from '@/types/notifications';

interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
}

interface Course {
  id: string;
  title: string;
}

interface Program {
  id: string;
  title: string;
}

interface CompactNotificationFormProps {
  users: User[];
  courses: Course[];
  programs: Program[];
  onSuccess: () => void;
  t: (key: string, fallback: string) => string;
  direction: 'ltr' | 'rtl';
}

export function CompactNotificationForm({
  users,
  courses,
  programs,
  onSuccess,
  t,
  direction,
}: CompactNotificationFormProps) {
  const [scope, setScope] = useState<NotificationScope>('tenant');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>([]);
  const [selectedProgramIds, setSelectedProgramIds] = useState<string[]>([]);
  const [category, setCategory] = useState<NotificationCategory>('announcement');
  const [priority, setPriority] = useState<NotificationPriority>('medium');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionUrl, setActionUrl] = useState('');
  const [actionLabel, setActionLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [sending, setSending] = useState(false);

  // Delivery channels
  const [emailEnabled, setEmailEnabled] = useState(false);
  const [emailLanguage, setEmailLanguage] = useState<'en' | 'he'>('he');
  const [smsEnabled, setSmsEnabled] = useState(false);

  // UI state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [userPopoverOpen, setUserPopoverOpen] = useState(false);
  const [coursePopoverOpen, setCoursePopoverOpen] = useState(false);
  const [programPopoverOpen, setProgramPopoverOpen] = useState(false);

  // Search state
  const [userSearch, setUserSearch] = useState('');
  const [courseSearch, setCourseSearch] = useState('');
  const [programSearch, setProgramSearch] = useState('');

  // Filtered lists
  const filteredUsers = users.filter(user => {
    if (!userSearch) return true;
    const searchLower = userSearch.toLowerCase();
    return (
      user.first_name?.toLowerCase().includes(searchLower) ||
      user.last_name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower)
    );
  });

  const filteredCourses = courses.filter(course => {
    if (!courseSearch) return true;
    return course.title?.toLowerCase().includes(courseSearch.toLowerCase());
  });

  const filteredPrograms = programs.filter(program => {
    if (!programSearch) return true;
    return program.title?.toLowerCase().includes(programSearch.toLowerCase());
  });

  const handleSend = async () => {
    if (!title.trim()) {
      toast.error(t('admin.notifications.errors.titleRequired', 'Title is required'));
      return;
    }
    if (!message.trim()) {
      toast.error(t('admin.notifications.errors.messageRequired', 'Message is required'));
      return;
    }

    // Validate selections
    if (scope === 'individual' && selectedUserIds.length === 0) {
      toast.error(t('admin.notifications.errors.userRequired', 'Please select at least one user'));
      return;
    }
    if (scope === 'course' && selectedCourseIds.length === 0) {
      toast.error(t('admin.notifications.errors.courseRequired', 'Please select at least one course'));
      return;
    }
    if (scope === 'program' && selectedProgramIds.length === 0) {
      toast.error(t('admin.notifications.errors.programRequired', 'Please select at least one program'));
      return;
    }

    setSending(true);

    try {
      const payload: CreateNotificationRequest = {
        scope,
        category,
        priority,
        title: title.trim(),
        message: message.trim(),
      };

      // Add targets based on scope
      if (scope === 'individual') payload.target_user_ids = selectedUserIds;
      if (scope === 'course') payload.target_course_ids = selectedCourseIds;
      if (scope === 'program') payload.target_program_ids = selectedProgramIds;

      // Optional fields
      if (actionUrl.trim()) payload.action_url = actionUrl.trim();
      if (actionLabel.trim()) payload.action_label = actionLabel.trim();
      if (expiresAt) payload.expires_at = new Date(expiresAt).toISOString();

      // Channels
      const channels: ('in_app' | 'email' | 'sms')[] = ['in_app'];
      if (emailEnabled) channels.push('email');
      if (smsEnabled) channels.push('sms');
      payload.channels = channels;

      if (emailEnabled) {
        payload.email_language = emailLanguage;
      }

      const response = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to send notification');
      }

      const result = await response.json();

      // Use translation with count parameter
      const count = result.count || 1;
      toast.success(t('admin.notifications.sentSuccessfully', `Successfully sent ${count} notification(s)`).replace('{count}', count.toString()));

      // Reset form
      setTitle('');
      setMessage('');
      setActionUrl('');
      setActionLabel('');
      setExpiresAt('');
      setSelectedUserIds([]);
      setSelectedCourseIds([]);
      setSelectedProgramIds([]);
      setEmailEnabled(false);
      setSmsEnabled(false);

      onSuccess();
    } catch (error: any) {
      toast.error(error.message || t('admin.notifications.errorSending', 'Failed to send notification'));
    } finally {
      setSending(false);
    }
  };

  // Get recipient count
  const getRecipientCount = () => {
    if (scope === 'tenant') return t('admin.notifications.allUsers', 'All Users');
    if (scope === 'individual') return selectedUserIds.length;
    if (scope === 'course') return selectedCourseIds.length;
    if (scope === 'program') return selectedProgramIds.length;
    return 0;
  };

  const removeUser = (userId: string) => {
    setSelectedUserIds(prev => prev.filter(id => id !== userId));
  };

  const removeCourse = (courseId: string) => {
    setSelectedCourseIds(prev => prev.filter(id => id !== courseId));
  };

  const removeProgram = (programId: string) => {
    setSelectedProgramIds(prev => prev.filter(id => id !== programId));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle suppressHydrationWarning>
          {t('admin.notifications.createTitle', 'Create Notification')}
        </CardTitle>
        <CardDescription suppressHydrationWarning>
          {t('admin.notifications.createDescription', 'Send a notification to your users')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4" dir={direction}>
        {/* Row 1: Scope + Recipients */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="scope" suppressHydrationWarning>
              {t('admin.notifications.scope', 'Scope')} *
            </Label>
            <Select value={scope} onValueChange={(v) => {
              setScope(v as NotificationScope);
              setSelectedUserIds([]);
              setSelectedCourseIds([]);
              setSelectedProgramIds([]);
            }}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tenant">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    <span suppressHydrationWarning>{t('admin.notifications.tenant', 'All Users')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="individual">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span suppressHydrationWarning>{t('admin.notifications.individual', 'Students')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="course">
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4" />
                    <span suppressHydrationWarning>{t('admin.notifications.course', 'Courses')}</span>
                  </div>
                </SelectItem>
                <SelectItem value="program">
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4" />
                    <span suppressHydrationWarning>{t('admin.notifications.program', 'Programs')}</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Multi-select for students */}
          {scope === 'individual' && (
            <div className="space-y-2">
              <Label suppressHydrationWarning>
                {t('admin.notifications.selectUsers', 'Select Students')} *
              </Label>
              <Popover open={userPopoverOpen} onOpenChange={setUserPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9" suppressHydrationWarning>
                    {selectedUserIds.length > 0 ? `${selectedUserIds.length} ${t('common.selected', 'selected')}` : t('admin.notifications.selectUsers', 'Select students...')}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b px-3">
                      <Input
                        placeholder={t('admin.notifications.searchUsers', 'Search students...')}
                        value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {filteredUsers.length === 0 ? (
                        <div className="py-6 text-center text-sm">{t('common.noResults', 'No results found')}</div>
                      ) : (
                        filteredUsers.map((user) => (
                          <div
                            key={user.id}
                            onClick={() => {
                              setSelectedUserIds(prev =>
                                prev.includes(user.id)
                                  ? prev.filter(id => id !== user.id)
                                  : [...prev, user.id]
                              );
                            }}
                            className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                          >
                            <Checkbox
                              checked={selectedUserIds.includes(user.id)}
                              className="ltr:mr-2 rtl:ml-2 pointer-events-none"
                            />
                            <span>{user.first_name} {user.last_name} ({user.email})</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {/* Selected chips */}
              {selectedUserIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedUserIds.map(userId => {
                    const user = users.find(u => u.id === userId);
                    return user ? (
                      <Badge key={userId} variant="secondary" className="text-xs gap-1">
                        {user.first_name} {user.last_name}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeUser(userId)} />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Multi-select for courses */}
          {scope === 'course' && (
            <div className="space-y-2">
              <Label suppressHydrationWarning>
                {t('admin.notifications.selectCourses', 'Select Courses')} *
              </Label>
              <Popover open={coursePopoverOpen} onOpenChange={setCoursePopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9" suppressHydrationWarning>
                    {selectedCourseIds.length > 0 ? `${selectedCourseIds.length} ${t('common.selected', 'selected')}` : t('admin.notifications.selectCourses', 'Select courses...')}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b px-3">
                      <Input
                        placeholder={t('admin.notifications.searchCourses', 'Search courses...')}
                        value={courseSearch}
                        onChange={(e) => setCourseSearch(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {filteredCourses.length === 0 ? (
                        <div className="py-6 text-center text-sm">{t('common.noResults', 'No results found')}</div>
                      ) : (
                        filteredCourses.map((course) => (
                          <div
                            key={course.id}
                            onClick={() => {
                              setSelectedCourseIds(prev =>
                                prev.includes(course.id)
                                  ? prev.filter(id => id !== course.id)
                                  : [...prev, course.id]
                              );
                            }}
                            className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                          >
                            <Checkbox
                              checked={selectedCourseIds.includes(course.id)}
                              className="ltr:mr-2 rtl:ml-2 pointer-events-none"
                            />
                            <span>{course.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {/* Selected chips */}
              {selectedCourseIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedCourseIds.map(courseId => {
                    const course = courses.find(c => c.id === courseId);
                    return course ? (
                      <Badge key={courseId} variant="secondary" className="text-xs gap-1">
                        {course.title}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeCourse(courseId)} />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}

          {/* Multi-select for programs */}
          {scope === 'program' && (
            <div className="space-y-2">
              <Label suppressHydrationWarning>
                {t('admin.notifications.selectPrograms', 'Select Programs')} *
              </Label>
              <Popover open={programPopoverOpen} onOpenChange={setProgramPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-9" suppressHydrationWarning>
                    {selectedProgramIds.length > 0 ? `${selectedProgramIds.length} ${t('common.selected', 'selected')}` : t('admin.notifications.selectPrograms', 'Select programs...')}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="start">
                  <div className="flex flex-col">
                    <div className="flex items-center border-b px-3">
                      <Input
                        placeholder={t('admin.notifications.searchPrograms', 'Search programs...')}
                        value={programSearch}
                        onChange={(e) => setProgramSearch(e.target.value)}
                        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                      />
                    </div>
                    <div className="max-h-[300px] overflow-y-auto p-1">
                      {filteredPrograms.length === 0 ? (
                        <div className="py-6 text-center text-sm">{t('common.noResults', 'No results found')}</div>
                      ) : (
                        filteredPrograms.map((program) => (
                          <div
                            key={program.id}
                            onClick={() => {
                              setSelectedProgramIds(prev =>
                                prev.includes(program.id)
                                  ? prev.filter(id => id !== program.id)
                                  : [...prev, program.id]
                              );
                            }}
                            className="flex items-center px-2 py-1.5 text-sm cursor-pointer hover:bg-accent rounded-sm"
                          >
                            <Checkbox
                              checked={selectedProgramIds.includes(program.id)}
                              className="ltr:mr-2 rtl:ml-2 pointer-events-none"
                            />
                            <span>{program.title}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
              {/* Selected chips */}
              {selectedProgramIds.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {selectedProgramIds.map(programId => {
                    const program = programs.find(p => p.id === programId);
                    return program ? (
                      <Badge key={programId} variant="secondary" className="text-xs gap-1">
                        {program.title}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeProgram(programId)} />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 2: Category + Priority */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="text-sm" suppressHydrationWarning>
              {t('admin.notifications.categoryLabel', 'Category')} *
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as NotificationCategory)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="lesson">{t('admin.notifications.categories.lesson', 'Lesson')}</SelectItem>
                <SelectItem value="assignment">{t('admin.notifications.categories.assignment', 'Assignment')}</SelectItem>
                <SelectItem value="payment">{t('admin.notifications.categories.payment', 'Payment')}</SelectItem>
                <SelectItem value="enrollment">{t('admin.notifications.categories.enrollment', 'Enrollment')}</SelectItem>
                <SelectItem value="attendance">{t('admin.notifications.categories.attendance', 'Attendance')}</SelectItem>
                <SelectItem value="achievement">{t('admin.notifications.categories.achievement', 'Achievement')}</SelectItem>
                <SelectItem value="announcement">{t('admin.notifications.categories.announcement', 'Announcement')}</SelectItem>
                <SelectItem value="system">{t('admin.notifications.categories.system', 'System')}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="priority" className="text-sm" suppressHydrationWarning>
              {t('admin.notifications.priorityLabel', 'Priority')} *
            </Label>
            <Select value={priority} onValueChange={(v) => setPriority(v as NotificationPriority)}>
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">{t('admin.notifications.priority.low', 'Low')}</SelectItem>
                <SelectItem value="medium">{t('admin.notifications.priority.medium', 'Medium')}</SelectItem>
                <SelectItem value="high">{t('admin.notifications.priority.high', 'High')}</SelectItem>
                <SelectItem value="urgent">{t('admin.notifications.priority.urgent', 'Urgent')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Row 3: Title */}
        <div className="space-y-2">
          <Label htmlFor="title" className="text-sm" suppressHydrationWarning>
            {t('admin.notifications.titleLabel', 'Title')} *
          </Label>
          <Input
            id="title"
            placeholder={t('admin.notifications.titlePlaceholder', 'Notification title...')}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={200}
            className="h-9"
          />
        </div>

        {/* Row 4: Message */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-sm" suppressHydrationWarning>
            {t('admin.notifications.messageLabel', 'Message')} *
          </Label>
          <Textarea
            id="message"
            placeholder={t('admin.notifications.messagePlaceholder', 'Notification message...')}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            maxLength={1000}
          />
          <p className="text-xs text-muted-foreground">{message.length}/1000</p>
        </div>

        {/* Row 5: Channels - Inline */}
        <div className="flex flex-wrap items-center gap-3 p-3 border rounded-lg bg-muted/30">
          <span className="text-sm font-medium" suppressHydrationWarning>
            {t('admin.notifications.channels', 'Channels')}:
          </span>
          <div className="flex items-center gap-2 opacity-60">
            <Checkbox checked disabled />
            <Label className="text-sm cursor-not-allowed" suppressHydrationWarning>
              {t('admin.notifications.channels.inApp', 'In-App')}
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox checked={emailEnabled} onCheckedChange={(c) => setEmailEnabled(c as boolean)} id="email-ch" />
            <Label htmlFor="email-ch" className="text-sm cursor-pointer" suppressHydrationWarning>
              {t('admin.notifications.channels.email', 'Email')}
            </Label>
          </div>
          {emailEnabled && (
            <Select value={emailLanguage} onValueChange={(v: 'en' | 'he') => setEmailLanguage(v)}>
              <SelectTrigger className="h-7 w-[120px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="he">עברית</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          )}
          <div className="flex items-center gap-2">
            <Checkbox checked={smsEnabled} onCheckedChange={(c) => setSmsEnabled(c as boolean)} id="sms-ch" />
            <Label htmlFor="sms-ch" className="text-sm cursor-pointer" suppressHydrationWarning>
              {t('admin.notifications.channels.sms', 'SMS')}
            </Label>
          </div>
        </div>

        {/* Row 6: Advanced (Collapsible) */}
        <div className="border-t pt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full justify-between"
          >
            <span suppressHydrationWarning>
              {t('admin.notifications.advancedOptions', 'Advanced Options')} ({t('common.optional', 'Optional')})
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </Button>
          {showAdvanced && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="actionUrl" className="text-sm" suppressHydrationWarning>
                  {t('admin.notifications.actionUrl', 'Action URL')}
                </Label>
                <Input
                  id="actionUrl"
                  placeholder="/courses/123"
                  value={actionUrl}
                  onChange={(e) => setActionUrl(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="actionLabel" className="text-sm" suppressHydrationWarning>
                  {t('admin.notifications.actionLabel', 'Action Label')}
                </Label>
                <Input
                  id="actionLabel"
                  placeholder={t('admin.notifications.actionLabelPlaceholder', 'View Details')}
                  value={actionLabel}
                  onChange={(e) => setActionLabel(e.target.value)}
                  className="h-9"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="expiresAt" className="text-sm" suppressHydrationWarning>
                  {t('admin.notifications.expiresAt', 'Expires At')}
                </Label>
                <Input
                  id="expiresAt"
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="h-9"
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 7: Send Button */}
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-muted-foreground" suppressHydrationWarning>
            {t('admin.notifications.sendTo', 'Sending to')}: <strong>{getRecipientCount()}</strong> {scope === 'tenant' ? '' : t('admin.notifications.recipients', 'recipient(s)')}
          </p>
          <Button
            onClick={handleSend}
            disabled={sending || !title.trim() || !message.trim()}
            size="lg"
          >
            {sending ? (
              <>
                <Loader2 className="ltr:mr-2 rtl:ml-2 h-4 w-4 animate-spin" />
                <span suppressHydrationWarning>
                  {t('admin.notifications.sending', 'Sending...')}
                </span>
              </>
            ) : (
              <>
                <Send className="ltr:mr-2 rtl:ml-2 h-4 w-4" />
                <span suppressHydrationWarning>
                  {t('admin.notifications.send', 'Send Notification')}
                </span>
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
