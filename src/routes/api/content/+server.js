import { json } from '@sveltejs/kit';
import { requireAuth } from '$lib/server/auth';
import {
	getPages,
	getPage,
	savePage,
	deletePage,
	getTeam,
	getTeamMember,
	saveTeamMember,
	deleteTeamMember,
	getServices,
	saveService,
	deleteService,
	getHeroSlides,
	saveHeroSlide,
	deleteHeroSlide,
	getContactInfo,
	saveContactInfo,
	getServiceTimes,
	saveServiceTimes,
	getSettings,
	saveSettings,
	getHome,
	saveHome,
	getPodcasts,
	getActivities,
	getActivity,
	saveActivity,
	deleteActivity,
	getCommunityGroups,
	getCommunityGroup,
	saveCommunityGroup,
	deleteCommunityGroup,
	getEvents,
	getEvent,
	saveEvent,
	deleteEvent,
	getChurches,
	getChurch,
	saveChurch,
	deleteChurch,
	getConferences,
	getConference,
	getConferenceBySlug,
	saveConference,
	deleteConference,
	getConferenceTicketTypes,
	getConferenceTicketType,
	saveConferenceTicketType,
	deleteConferenceTicketType,
	getConferenceBookings,
	getConferenceBooking,
	saveConferenceBooking,
	deleteConferenceBooking,
	getConferenceAttendees,
	getConferenceAttendee,
	saveConferenceAttendee,
	deleteConferenceAttendee,
	getConferenceDiscountCodes,
	getConferenceDiscountCode,
	saveConferenceDiscountCode,
	deleteConferenceDiscountCode,
	getConferencePaymentSchedules,
	getConferencePaymentSchedule,
	saveConferencePaymentSchedule,
	deleteConferencePaymentSchedule,
	getConferenceFormFields,
	getConferenceFormField,
	saveConferenceFormField,
	deleteConferenceFormField,
	getNavigationLinks,
	getNavigationLink,
	saveNavigationLink,
	deleteNavigationLink,
	getPolicy,
	savePolicy,
	getAllPolicies
} from '$lib/server/database';

export const GET = async ({ url, cookies }) => {
	requireAuth({ cookies });

	const type = url.searchParams.get('type');
	const id = url.searchParams.get('id');

	try {
		switch (type) {
			case 'pages':
				return json(id ? getPage(id) : getPages());
			case 'team':
				return json(id ? getTeamMember(id) : getTeam());
			case 'services':
				return json(getServices());
			case 'hero-slides':
				return json(getHeroSlides());
			case 'contact':
				return json(getContactInfo());
			case 'service-times':
				return json(getServiceTimes());
			case 'settings':
				return json(getSettings());
			case 'home':
				return json(getHome());
			case 'activities':
				return json(id ? getActivity(id) : getActivities());
			case 'community-groups':
				return json(id ? getCommunityGroup(id) : getCommunityGroups());
			case 'events':
				return json(id ? getEvent(id) : getEvents());
			case 'churches':
				return json(id ? getChurch(id) : getChurches());
			case 'churches-for-conference':
				return json(getChurches({ conferenceOnly: true }));
			case 'conferences':
				return json(id ? getConference(id) : getConferences());
			case 'conference-by-slug':
				const slug = url.searchParams.get('slug');
				return json(slug ? getConferenceBySlug(slug) : null);
			case 'conference-ticket-types':
				const conferenceId = url.searchParams.get('conferenceId');
				return json(conferenceId ? getConferenceTicketTypes(conferenceId) : []);
			case 'conference-ticket-type':
				return json(id ? getConferenceTicketType(id) : null);
			case 'conference-bookings':
				const confId = url.searchParams.get('conferenceId');
				return json(confId ? getConferenceBookings(confId) : getConferenceBookings());
			case 'conference-booking':
				return json(id ? getConferenceBooking(id) : null);
			case 'conference-attendees':
				const bookingId = url.searchParams.get('bookingId');
				return json(bookingId ? getConferenceAttendees(bookingId) : getConferenceAttendees());
			case 'conference-attendee':
				return json(id ? getConferenceAttendee(id) : null);
			case 'conference-discount-codes':
				const discConfId = url.searchParams.get('conferenceId');
				return json(discConfId ? getConferenceDiscountCodes(discConfId) : getConferenceDiscountCodes());
			case 'conference-discount-code':
				const code = url.searchParams.get('code');
				const codeConfId = url.searchParams.get('conferenceId');
				return json(code ? getConferenceDiscountCode(code, codeConfId) : null);
			case 'conference-payment-schedules':
				const payBookingId = url.searchParams.get('bookingId');
				return json(payBookingId ? getConferencePaymentSchedules(payBookingId) : getConferencePaymentSchedules());
			case 'conference-payment-schedule':
				return json(id ? getConferencePaymentSchedule(id) : null);
			case 'conference-form-fields':
				const formType = url.searchParams.get('formType');
				return json(getConferenceFormFields(formType));
			case 'conference-form-field':
				return json(id ? getConferenceFormField(id) : null);
			case 'navigation-links':
				return json(getNavigationLinks());
			case 'navigation-link':
				return json(id ? getNavigationLink(id) : null);
			case 'policies':
				return json(getAllPolicies());
			case 'policy':
				if (!id) {
					return json({ error: 'Policy type required' }, { status: 400 });
				}
				return json(getPolicy(id));
			default:
				return json({ error: 'Invalid type' }, { status: 400 });
		}
	} catch (error) {
		return json({ error: 'Failed to fetch data' }, { status: 500 });
	}
};

export const POST = async ({ request, cookies }) => {
	requireAuth({ cookies });

	const { type, data } = await request.json();

	try {
		switch (type) {
			case 'page':
				// Debug logging for page saves
				console.log('[API] Saving page:', {
					id: data.id,
					title: data.title,
					hasSections: !!data.sections,
					sectionsCount: data.sections?.length || 0,
					sectionsTypes: data.sections?.map(s => s?.type) || [],
					sectionsPreview: data.sections?.slice(0, 2).map(s => ({ type: s.type, title: s.title })) || []
				});
				savePage(data);
				return json({ success: true });
			case 'team':
				saveTeamMember(data);
				return json({ success: true });
			case 'service':
				saveService(data);
				return json({ success: true });
			case 'hero-slide':
				saveHeroSlide(data);
				return json({ success: true });
			case 'contact':
				saveContactInfo(data);
				return json({ success: true });
			case 'service-times':
				saveServiceTimes(data);
				return json({ success: true });
			case 'settings':
				saveSettings(data);
				return json({ success: true });
			case 'home':
				saveHome(data);
				return json({ success: true });
			case 'activity':
				saveActivity(data);
				return json({ success: true });
			case 'community-group':
				saveCommunityGroup(data);
				return json({ success: true });
			case 'event':
				saveEvent(data);
				return json({ success: true });
			case 'church':
				saveChurch(data);
				return json({ success: true });
			case 'conference':
				saveConference(data);
				return json({ success: true });
			case 'conference-ticket-type':
				saveConferenceTicketType(data);
				return json({ success: true });
			case 'conference-booking':
				saveConferenceBooking(data);
				return json({ success: true });
			case 'conference-attendee':
				saveConferenceAttendee(data);
				return json({ success: true });
			case 'conference-discount-code':
				saveConferenceDiscountCode(data);
				return json({ success: true });
			case 'conference-payment-schedule':
				saveConferencePaymentSchedule(data);
				return json({ success: true });
			case 'conference-form-field':
				saveConferenceFormField(data);
				return json({ success: true });
			case 'navigation-link':
				saveNavigationLink(data);
				return json({ success: true });
			case 'policy':
				if (!data.type) {
					return json({ error: 'Policy type required' }, { status: 400 });
				}
				savePolicy(data.type, data);
				return json({ success: true });
			case 'policy':
				if (!data.type) {
					return json({ error: 'Policy type required' }, { status: 400 });
				}
				savePolicy(data.type, data);
				return json({ success: true });
			default:
				return json({ error: 'Invalid type' }, { status: 400 });
		}
	} catch (error) {
		return json({ error: 'Failed to save data' }, { status: 500 });
	}
};

export const DELETE = async ({ url, cookies }) => {
	requireAuth({ cookies });

	const type = url.searchParams.get('type');
	const id = url.searchParams.get('id');

	if (!id) {
		return json({ error: 'ID required' }, { status: 400 });
	}

	try {
		switch (type) {
			case 'page':
				deletePage(id);
				return json({ success: true });
			case 'team':
				deleteTeamMember(id);
				return json({ success: true });
			case 'service':
				deleteService(id);
				return json({ success: true });
			case 'hero-slide':
				deleteHeroSlide(id);
				return json({ success: true });
			case 'activity':
				deleteActivity(id);
				return json({ success: true });
			case 'community-group':
				deleteCommunityGroup(id);
				return json({ success: true });
			case 'event':
				deleteEvent(id);
				return json({ success: true });
			case 'church':
				deleteChurch(id);
				return json({ success: true });
			case 'conference':
				deleteConference(id);
				return json({ success: true });
			case 'conference-ticket-type':
				deleteConferenceTicketType(id);
				return json({ success: true });
			case 'conference-booking':
				deleteConferenceBooking(id);
				return json({ success: true });
			case 'conference-attendee':
				deleteConferenceAttendee(id);
				return json({ success: true });
			case 'conference-discount-code':
				deleteConferenceDiscountCode(id);
				return json({ success: true });
			case 'conference-payment-schedule':
				deleteConferencePaymentSchedule(id);
				return json({ success: true });
			case 'conference-form-field':
				deleteConferenceFormField(id);
				return json({ success: true });
			case 'navigation-link':
				deleteNavigationLink(id);
				return json({ success: true });
			default:
				return json({ error: 'Invalid type' }, { status: 400 });
		}
	} catch (error) {
		return json({ error: 'Failed to delete' }, { status: 500 });
	}
};
