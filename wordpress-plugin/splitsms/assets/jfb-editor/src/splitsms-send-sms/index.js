import SendSmsRender from './render';
import { __ } from '@wordpress/i18n';

export default {
	type: 'splitsms_send_sms',
	label: __('Send SMS', 'splitsms'),
	edit: SendSmsRender,
	icon: (
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
			<path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H5.2L4 17.2V4h16v12zM7 9h2v2H7V9zm4 0h2v2h-2V9zm4 0h2v2h-2V9z" />
		</svg>
	),
	category: 'communication',
	validators: [
		({ settings }) => {
			if (!settings?.message?.trim()) {
				return { type: 'empty', property: 'message' };
			}
			if (settings?.sms_to === 'form' && !settings?.phone_field?.trim()) {
				return { type: 'empty', property: 'phone_field' };
			}
			if (settings?.sms_to === 'custom' && !settings?.custom_phone?.trim()) {
				return { type: 'empty', property: 'custom_phone' };
			}
			return false;
		},
	],
};
