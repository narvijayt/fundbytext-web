- In participant view, i am still seeing which are not added by me

- In the organizer view, it shows campaign name with status (Active, Upcoming, Completed) and in right side Edit Camapign. But in the participant view show the Campaign Name | Participant Name and show badge somewhere suitable

- Remove Amount Raised, PROGRESS, TOTAL DONATIONS, DAYS LEFT, Start Date & Time, End Date & Time, Time Remaining - We will not show them as block. I have shared the progress bar image that how we will these details - how much raised, how initial goal meta and scale amount is showing, no. of donations and campaign time period.

- Progress towards your goal - I think we should add option to see graph by days vs amount, week vs amount,. In days vs amount if it go three months then we have 90 days, so we can show next days.

- LIVE DONATION FEED: Show only 8 donations if it has more add See All button, right to its title. which opens another modal to veiw all. Same for Participant Rankings (Participant View).

- Participant Notifications: Show Notification box below live donations - Same show listing of 8, and see all option to open modal.

- Donors Listing: Show Not Donated status instead of pending, also show date donated and Last contacted(basically added when). When view is clicked, for organizer view show assign to participant option to edit if not donated yet . Allow donors card to take full wisth means take space where live donation feed and other cards are showing.

- Show Participant Statistics at bottom:
   AMOUNT RAISED FROM ANONYMOUS DONORS
   total money Raised
   percentage contributed
   avg Donation Per Donor

- Overall Statistics
    Potentials Doners
    Donor Engagement
    Average Donation
    Average amount of $ per day


---------------------------------------------

- When adding donors in participant view mode, they are added as unassigned which results in not seeing them there.

- When donor visits donation link, remove donation modal and give option to add amount where we add card details on top, also auto select the participant using url from which participant donor has received the email.

- In the donation listing, show if this user donate you as anonymously. Also, id donated to general fund as organizer view.

- Show Participant ranking, below Live Donation Feed and show my notifications under Progress towards your goal

- Change term for "Progress towards your goal" for participant view as it is campaign goal I think "Progress towards campaign goal" should be.

- When accessing public campaign page i am unable to request anything like processing payment if i am not authenticated/ It is public page so no need to check any loggedin user


---------------------------------------------

- Organization Logo does not show error to upload as it is mandatory
- Allow organizer to remove himself as participant when view participant
- Incorrect donors per particpant goal and do not allow to edit donor target when viewing participant.
- When adding participant during campaign creation and when launching we send email to participant added with two emails: login details and participation in campaign (not if adding my self). We have to send these when adding participant from dashboard campaign.
- 

---------------------------------------------

1. When organizer is adding donors (from dashboard campaign not during campaign creation), he can only assign participants which are added to that campaign. I am seeing participant of one campaign into another under assign (add donor modal).
2. You can not delete an upcoming campaign once it has received donations.
3. Created a Individual campaign, which only allows adding donors but in dashboard campaign listing. I am able to Campaign Goal: $248
Donors added: 1
Participants: 1 <- Remove this.
4. Created a campaign and set it start date time of today 5 minutes later to check if it can go live 5 minutes or not. bUt after 5 minutes it still showing upcoming not active. We should add option to add campaign to make it private/publish if went live/active or featuring in upcoming campaign in marketing pages. Should we also mark it as complete. How other platforms do this 
    - Add cron job to update status like from upcoming to active and active to completed
    - Add Visiblility feature: Private/Published
    - Enable Donations
    - Mark as Complete
5. Do not show donation amount card under amount raised in public campaign page when coming for donor shared link. Behave like coming without shared link(opens the modal where user puts amount with card details).
6. Do not show Assigned to (in listing) option in individual campaigns, as individual campaigns don't have participants.
7. Can not see Participants listing and Participant add card under Progress towards your campaign. Show this to organizers and if campaign is organzational not individual. 



---------------------------------------------

Campaign Notifications:

1. Campaign launched.
2. Your campaign is now active.
3. [name] donated $400 to your campaign.
4. This participant has completed its goal.
5. Campaign goal completed its initial goal and scaled with 20%.
6. Your campaign has completed it goal.

Participant Notifications:

1. [Organizer] has added you as participant in [CampaignName]
2. [DonorName] donates $400.
3. You have completed your funding goal.
4. Campaign has completed its goal.
5. Campaign completed successfully!.

---------------------------------------------

Receiving two emails. I think when adding participant during campaign creation and secondly when launching the campaign. Send only on launch.
You're a participant in "Rural America Revive Fund" — here's how to get started


---------------------------------------------

1. Allow editing the fundraising goal - incase we have to increase funding amount later.
2. Allow editing the Donors per Participant - as graphs and other calculations can be done at realtime.
3. Where we show [View public page], show the url too to copy 
4. Show realtime coundown on campaign marketing page.
5. Realastic charts and animations
6. Show campaign starts in if upcoming.
7. Default campaign creation as Public.
8. In Individual campaign, donors receives support email does have  ref token
9. Wrong chart formation


---------------------------------------------
1. I am able to see donation modal open when clicked from leaderboard when campaign is in upcoming stage.
2. In sidebar campaigns, Remove Participants and Campaign Notifications under campaigns for user with campaign role participant. 
3. Do not show Participants in sidebar campaign dropdown if campaign is individual

---------------------------------------------
1. Progress Bar: Display Initial goal and scaled amount
2. Show correct total amount in marketing campaign page  
3. Add scale notification every time it touched the scaled amount.
4. Notification feature on Dashboard page
5. Use ably/pusher for real time updates 
6. Show only 5 notifications in a container
7. Auto-scaling works incorrect.
8. Show countdown under progress bar.

---------------------------------------------
1. When adding end date and time to campaign make sure we are not able to select past dates from start date and time selected.

---------------------------------------------
1. When ever a donation received, update dashboard campaign page which creator sees and i am not sure if we have to do this on marketing page because on heavy request its not possible, or update if after specific interval no sure how this works in large scale apps.

2. For Live donation feed and notifications, we can list only or means get 5 only from database instead of all when sell all is clicked we can get 10 then load more funcality to it but keep the modal size same, also for notifications listing as well

3. Adding new donors and handle multiple donations under their id --DONE
4. Handle donor pagination
5. Disable outer scroll when modal open and disable outer click. 
6. What if thousands of users donating, then we keep updating dashboard or refresh logic.


---------------------------------------------
1. When selecting "What type of campaign are you running?", if not selected it shows an error "Please select a campaign type" but if i select one of them hide the error. -- DONE
2. While adding donors in step 4 i am able to add duplicate myself which is wrong, I can add myself only one time --DONE
3. Accept Donations - Only processed while the campaign is active - When camapign is upcoming and when switch is clicked, we can show toast for error --DONE
4. When cron job is hit, update details in specific dashboard campaign --DONE


# Tasks ---------------------------------------------
1. Incorrect Notifications to participants
2. Adding donor with the same email
3. Add Participants: Adding myself and notification alert (multiple triggers), leave participant role (view + Participant view)









Core Operations

Users — view all registered users, see their campaigns, disable/suspend accounts

Campaigns — browse all campaigns across the platform, filter by status, force-complete or force-pause any campaign, view financials
Donations — full donation ledger across all campaigns, export, flag suspicious transactions
Financial

Payouts — see all payout records, mark as paid/pending, track disbursement status

Payments — Stripe payment intent log, failed payments, refund initiation
Platform Health

Notifications Log — view all notifications sent platform-wide, debug delivery issues

Cron / Jobs — see last tick time, manually trigger the cron tick, view campaign status transition history
Content & Access

Platform Settings — Stripe keys, Ably keys, feature flags, maintenance mode toggle
Audit Log — who did what and when (campaign launches, completions, member changes)
What I'd suggest starting with (highest value, lowest complexity):

Campaigns — most critical for support/operations
Users — account management
Donations — financial visibility
Payouts — disbursement tracking
The rest (audit log, cron monitor, platform settings) can come later.

Want me to scaffold the admin sidebar and route structure, starting with those four modules?


# Tasks ---------------------------------------------

1. Should we allow restoring the user account if deleted and new one exists with the same credentials.
2. Create New User.
3. Admin Users Listing.

Admin control over visinlity, Donation enable, 
When visiting user by clicking users in admin campaign view, add back button to came back to this screen 

- An admin can edit his own account details but not of other admins 
- Continue where we left: make sure to add scroll in modal so that they dont touch top and bottom of browser screen



# Tasks ---------------------------------------------

1. Should we show initial goal completed in individual open ended campaign??? --DONE
2. In the Individual fixed goal, when goal is completed and donor visit through the link it openup the donation modal which should not be opened bc in fixed goal we can't donate additional amount so its meaningless to open donation modal. --DONE
3. CSV Import feature top upload participant or donors --DONE
4. When we do Proviate a campaign, should that be private to participants as well? suggest me. --DONE
5. In organizer view, I added a donor to a participant (myself) but did not tagged added by me for organizer and preasigned by organizer for participant but for other participant "added by me" shows but for that participant not showing (preassigned by admin) later starts showing. Check what's issue --DONE
6. Goal reached not showing in organization - shared goal type campaign under progressbar in dashboard campaign. --DONE
7. Email alert confimation on actions like adding participant.
8. smallcase emails while adding --DONE
9. Should we allow tab click in campaign edit??
10. Overview x axis text overlaps --DONE

# Tasks for later ---------------------------------------------
1. Ask Ai Buddy and onboarding participant modals.

# Tasks --------------------------------------------- April 20
1. Add donation success modal (General Fund (or Individual Campaign - Organizer Name) / To Participant) --DONE
2. Top Donor tag. --DONE
3. Should we allow tab click in campaign edit?? --DONE
4. Ask for send alerts when adding participant or donors.??
5. While viewing participant profile, does it show participant profile? --DONE
6. Do not border radius in progress bar. Left and Right side are ok but at centre do not. --DONE
7. When we added a participant or donor, add option to edit them. --DONE
8. When organizer is view camapign as participant in dashboard campaign, and adding donor, it display preassigned by organizer but it should not be shown anything. Only if organizer added donate to himself by assign then it should work and for others --DONE
9. If donor is coming through link, and prefilled donor name display in modal but if donor closes modal and click on Donate Now it shows to select participant or general fund. If this happens and general fund is selected the payment should be gone to general fund not to the participant which select using the link. --DONE
10. In the organization, per participant campaign in marketing page it shows incorrect fundraising goal. it should be fundraising goal x no. of participants --DONE


# Tasks --------------------------------------------- April 22
1. Allow upload user image in admin view.
2. When organizer added a participant and participant account got created. Later if, organizer remove from campaign, then in the admin user view - it shows Created By Admin. But it should still show added as participant in this [X] campaign.
3. Add lazy or suspense loading. 
4. Add pagination and filters in participant listing.
5. In the admin view donations listing, attributed to: General Fund tag is so dull.