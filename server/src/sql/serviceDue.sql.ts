const SERVICE_DUE_SQL = `
SELECT sm.carId, 
       sm.description, 
       sm.mileage, 
       sm.months, 
       max(sh.serviceDate) as lastServiceDate, 
       max(sh.mileage) as lastServiceMileage, 
       DATEDIFF(DATE_ADD(COALESCE(max(sh.serviceDate),c.inserviceDate), INTERVAL months  MONTH), now()) as dueDays, 
       COALESCE(max(sh.mileage),0)+sm.mileage-c.mileage as dueIn 
FROM my_garage c 
    JOIN scheduled_maintenance sm on c.id=sm.carId 
    LEFT OUTER JOIN service_history sh on sh.description=sm.description and sh.carId=sm.carId 
WHERE c.token=? 
GROUP BY sm.id, sm.description, sm.mileage, sm.months`;

const UPCOMING_SERVICE_SQL = `SELECT * FROM (${SERVICE_DUE_SQL}) as s WHERE dueIn<500 ORDER BY dueIn desc`;

export { SERVICE_DUE_SQL, UPCOMING_SERVICE_SQL}