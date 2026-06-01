import { __ } from '@wordpress/i18n';
import { Flex, TextareaControl, CheckboxControl } from '@wordpress/components';
import { WideLine } from 'jet-form-builder-components';
import { useFields } from 'jet-form-builder-blocks-to-actions';
import { ValidatedSelectControl, ValidatedTextControl } from 'jet-form-builder-actions';

const SMS_TO_OPTIONS = [
	{ value: 'form', label: __('Phone from submitted form field', 'splitsms') },
	{ value: 'custom', label: __('Custom phone / macros', 'splitsms') },
	{ value: 'admin', label: __('Admin phone (SplitSMS settings)', 'splitsms') },
];

const SMS_TO_HELP = {
	form: __('Pick the form field that stores the recipient number.', 'splitsms'),
	custom: __('Use macros like %phone%, %post_id%, %user_id%, or {phone}.', 'splitsms'),
	admin: __('Uses the admin phone from SplitSMS settings.', 'splitsms'),
};

function SendSmsRender({ settings, onChangeSettingObj, actionData }) {
	const smsTo = settings?.sms_to || 'form';
	const configured = actionData?.configured !== false;

	const formFields = useFields({
		withInner: false,
		placeholder: '--',
	});

	const optionalFields = useFields({
		withInner: false,
		placeholder: __('— None —', 'splitsms'),
	});

	return (
		<Flex direction="column" gap={3}>
			{!configured && (
				<p style={{ margin: 0, color: '#b32d2e' }}>
					{__('Connect SplitSMS in Settings → API key before this action can send on submit.', 'splitsms')}
				</p>
			)}

			<ValidatedSelectControl
				label={__('Phone number / Send to', 'splitsms')}
				value={smsTo}
				options={SMS_TO_OPTIONS}
				help={SMS_TO_HELP[smsTo]}
				onChange={(val) => onChangeSettingObj({ sms_to: val })}
				isErrorSupported={(error) => error?.property === 'sms_to'}
				required
			/>

			{smsTo === 'form' && (
				<>
					<WideLine />
					<ValidatedSelectControl
						label={__('Phone field', 'splitsms')}
						value={settings?.phone_field || 'phone'}
						options={formFields}
						onChange={(val) => onChangeSettingObj({ phone_field: val })}
						isErrorSupported={(error) => error?.property === 'phone_field'}
						required
					/>
				</>
			)}

			{smsTo === 'custom' && (
				<>
					<WideLine />
					<ValidatedTextControl
						label={__('Phone number (macros)', 'splitsms')}
						value={settings?.custom_phone || ''}
						placeholder="%phone% or %post_id% or +233XXXXXXXXX"
						onChange={(val) => onChangeSettingObj({ custom_phone: val })}
						isErrorSupported={(error) => error?.property === 'custom_phone'}
						required
					/>
				</>
			)}

			<WideLine />

			<TextareaControl
				label={__('Message', 'splitsms')}
				value={settings?.message || ''}
				onChange={(val) => onChangeSettingObj({ message: val })}
				rows={4}
				help={__('Supports all form macros: %field%, {field}, %post_id%, %user_id%.', 'splitsms')}
				__nextHasNoMarginBottom
			/>

			<WideLine />

			<ValidatedSelectControl
				label={__('Country code field (optional)', 'splitsms')}
				value={settings?.country_code_field || ''}
				options={optionalFields}
				help={__('Optional ISO code field (e.g. GH). Uses plugin default if empty.', 'splitsms')}
				onChange={(val) => onChangeSettingObj({ country_code_field: val })}
			/>

			<ValidatedTextControl
				label={__('Sender ID override (optional)', 'splitsms')}
				value={settings?.sender_id || ''}
				placeholder={__('Uses plugin default if empty', 'splitsms')}
				onChange={(val) => onChangeSettingObj({ sender_id: val })}
			/>

			<CheckboxControl
				label={__('Also send a copy to admin', 'splitsms')}
				checked={!!settings?.send_admin_copy}
				onChange={(val) => onChangeSettingObj({ send_admin_copy: val ? '1' : '' })}
			/>

			{!!settings?.send_admin_copy && (
				<TextareaControl
					label={__('Admin message', 'splitsms')}
					value={settings?.admin_message || ''}
					onChange={(val) => onChangeSettingObj({ admin_message: val })}
					rows={3}
					__nextHasNoMarginBottom
				/>
			)}
		</Flex>
	);
}

export default SendSmsRender;
