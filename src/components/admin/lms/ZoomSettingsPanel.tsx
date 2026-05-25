'use client';

/**
 * Shared Zoom settings panel — used by both the single-lesson dialog
 * and the bulk-lesson dialog so admins get identical security /
 * video+audio / recording controls in either flow.
 *
 * Was previously inlined only in the bulk dialog; the single-lesson
 * dialog had only topic/agenda. Result: admins creating a single
 * lesson got default Zoom settings (e.g. no recording) with no way to
 * opt in. Extracted here so a single source of truth governs both.
 */

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

export interface ZoomSettings {
  zoom_passcode: string;
  zoom_waiting_room: boolean;
  zoom_join_before_host: boolean;
  zoom_mute_upon_entry: boolean;
  zoom_require_authentication: boolean;
  zoom_host_video: boolean;
  zoom_participant_video: boolean;
  zoom_audio: 'both' | 'telephony' | 'voip';
  zoom_auto_recording: 'none' | 'local' | 'cloud';
  zoom_record_speaker_view: boolean;
  zoom_recording_disclaimer: boolean;
}

interface Props {
  settings: ZoomSettings;
  onChange: (patch: Partial<ZoomSettings>) => void;
  /** Optional translator. Falls back to the English defaults below. */
  t?: (key: string, fallback: string) => string;
  isRtl?: boolean;
  direction?: 'ltr' | 'rtl';
}

export function ZoomSettingsPanel({
  settings,
  onChange,
  t = (_k, fb) => fb,
  isRtl = false,
  direction = 'ltr',
}: Props) {
  const rowClass = `flex items-center ${isRtl ? 'gap-2 flex-row-reverse' : 'gap-2'}`;
  const labelAlign = isRtl ? 'text-right' : 'text-left';
  const hAlign = `text-sm font-semibold text-foreground ${labelAlign}`;
  const fieldLabelClass = `block text-sm ${labelAlign}`;
  const inputClass = `${labelAlign}`;
  const selectClass = `flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ${labelAlign}`;

  return (
    <div className="space-y-6">
      {/* Security */}
      <div className="space-y-3 pt-3 border-t border-border/50" dir={direction}>
        <h4 className={hAlign}>
          {t('lms.zoom.security_settings_title', 'Security Settings')}
        </h4>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>
            {t('lms.zoom.passcode_label', 'Meeting Passcode (Optional)')}
          </Label>
          <Input
            type="text"
            value={settings.zoom_passcode}
            onChange={(e) => onChange({ zoom_passcode: e.target.value })}
            placeholder={t('lms.zoom.passcode_placeholder', 'Enter passcode...')}
            className={inputClass}
            dir={direction}
            maxLength={10}
          />
          <p className={`text-xs text-muted-foreground ${labelAlign}`}>
            {t('lms.zoom.passcode_help', 'Passcode to prevent unauthorized access (6-10 characters)')}
          </p>
        </div>

        <div className={rowClass} dir={direction}>
          <Switch
            checked={settings.zoom_waiting_room}
            onCheckedChange={(checked) => onChange({ zoom_waiting_room: checked })}
          />
          <Label className={`cursor-pointer text-sm ${labelAlign}`}>
            {t('lms.zoom.waiting_room_label', 'Waiting Room')}
          </Label>
        </div>

        <div className={rowClass} dir={direction}>
          <Switch
            checked={settings.zoom_join_before_host}
            onCheckedChange={(checked) => onChange({ zoom_join_before_host: checked })}
          />
          <Label className={`cursor-pointer text-sm ${labelAlign}`}>
            {t('lms.zoom.join_before_host_label', 'Allow participants to join before host')}
          </Label>
        </div>

        <div className={rowClass} dir={direction}>
          <Switch
            checked={settings.zoom_mute_upon_entry}
            onCheckedChange={(checked) => onChange({ zoom_mute_upon_entry: checked })}
          />
          <Label className={`cursor-pointer text-sm ${labelAlign}`}>
            {t('lms.zoom.mute_upon_entry_label', 'Mute participants upon entry')}
          </Label>
        </div>

        <div className={rowClass} dir={direction}>
          <Switch
            checked={settings.zoom_require_authentication}
            onCheckedChange={(checked) => onChange({ zoom_require_authentication: checked })}
          />
          <Label className={`cursor-pointer text-sm ${labelAlign}`}>
            {t('lms.zoom.require_authentication_label', 'Require authentication to join')}
          </Label>
        </div>
      </div>

      {/* Video / Audio */}
      <div className="space-y-3 pt-3 border-t border-border/50" dir={direction}>
        <h4 className={hAlign}>
          {t('lms.zoom.video_audio_settings_title', 'Video & Audio Settings')}
        </h4>

        <div className={rowClass} dir={direction}>
          <Switch
            checked={settings.zoom_host_video}
            onCheckedChange={(checked) => onChange({ zoom_host_video: checked })}
          />
          <Label className={`cursor-pointer text-sm ${labelAlign}`}>
            {t('lms.zoom.host_video_label', 'Start host video on entry')}
          </Label>
        </div>

        <div className={rowClass} dir={direction}>
          <Switch
            checked={settings.zoom_participant_video}
            onCheckedChange={(checked) => onChange({ zoom_participant_video: checked })}
          />
          <Label className={`cursor-pointer text-sm ${labelAlign}`}>
            {t('lms.zoom.participant_video_label', 'Start participant video on entry')}
          </Label>
        </div>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>
            {t('lms.zoom.audio_options_label', 'Audio Options')}
          </Label>
          <select
            value={settings.zoom_audio}
            onChange={(e) => onChange({ zoom_audio: e.target.value as ZoomSettings['zoom_audio'] })}
            className={selectClass}
            dir={direction}
          >
            <option value="both">{t('lms.zoom.audio_both', 'Phone and Computer')}</option>
            <option value="telephony">{t('lms.zoom.audio_telephony', 'Phone Only')}</option>
            <option value="voip">{t('lms.zoom.audio_voip', 'Computer Only')}</option>
          </select>
        </div>
      </div>

      {/* Recording */}
      <div className="space-y-3 pt-3 border-t border-border/50" dir={direction}>
        <h4 className={hAlign}>
          {t('lms.zoom.recording_settings_title', 'Recording Settings')}
        </h4>

        <div className="space-y-2">
          <Label className={fieldLabelClass}>
            {t('lms.zoom.auto_recording_label', 'Automatic Recording')}
          </Label>
          <select
            value={settings.zoom_auto_recording}
            onChange={(e) => onChange({ zoom_auto_recording: e.target.value as ZoomSettings['zoom_auto_recording'] })}
            className={selectClass}
            dir={direction}
          >
            <option value="none">{t('lms.zoom.recording_none', 'No Recording')}</option>
            <option value="local">{t('lms.zoom.recording_local', 'Local Recording')}</option>
            <option value="cloud">{t('lms.zoom.recording_cloud', 'Cloud Recording')}</option>
          </select>
        </div>

        <div className={rowClass} dir={direction}>
          <Switch
            checked={settings.zoom_record_speaker_view}
            onCheckedChange={(checked) => onChange({ zoom_record_speaker_view: checked })}
          />
          <Label className={`cursor-pointer text-sm ${labelAlign}`}>
            {t('lms.zoom.record_speaker_view_label', 'Record active speaker with shared screen')}
          </Label>
        </div>

        <div className={rowClass} dir={direction}>
          <Switch
            checked={settings.zoom_recording_disclaimer}
            onCheckedChange={(checked) => onChange({ zoom_recording_disclaimer: checked })}
          />
          <Label className={`cursor-pointer text-sm ${labelAlign}`}>
            {t('lms.zoom.recording_disclaimer_label', 'Show recording disclaimer to participants')}
          </Label>
        </div>
      </div>
    </div>
  );
}

/** Sensible defaults — identical to the bulk dialog's hardcoded initial state. */
export const ZOOM_SETTINGS_DEFAULTS: ZoomSettings = {
  zoom_passcode: '',
  zoom_waiting_room: true,
  zoom_join_before_host: false,
  zoom_mute_upon_entry: false,
  zoom_require_authentication: false,
  zoom_host_video: true,
  zoom_participant_video: true,
  zoom_audio: 'both',
  zoom_auto_recording: 'none',
  zoom_record_speaker_view: false,
  zoom_recording_disclaimer: false,
};
