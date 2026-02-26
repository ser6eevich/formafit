function checkDateLogic(tzOffset) {
    const now = new Date();
    console.log("Current UTC Time:", now.toISOString());
    console.log("TZ Offset received:", tzOffset);

    const userTime = new Date(now.getTime() - (tzOffset * 60000));
    console.log("Calculated User Wall Clock (as UTC Date):", userTime.toISOString());

    const startOfUserDay = new Date(userTime);
    startOfUserDay.setUTCHours(0, 0, 0, 0);
    console.log("Start of User Day (as UTC Date):", startOfUserDay.toISOString());

    const startOfDayUTC = new Date(startOfUserDay.getTime() + (tzOffset * 60000));
    console.log("Final StartOfDay UTC for Query:", startOfDayUTC.toISOString());
}

console.log("--- Testing with Moscow (-180) ---");
checkDateLogic(-180);
