const SERVICE_DUE_SQL = `
select sm.carId, 
       sm.service, 
       sm.mileage, 
       sm.months, 
       max(sh.serviceDate) as last_service_date, 
       max(sh.mileage) as last_service_mileage, 
       DATE_ADD(COALESCE(max(sh.serviceDate),c.inserviceDate), INTERVAL months  MONTH) as due_by, 
       LEAST(DATEDIFF(DATE_ADD(COALESCE(max(sh.serviceDate),c.inserviceDate), INTERVAL months  MONTH), now()) * 34, 
       COALESCE(max(sh.mileage),0)+sm.mileage-c.mileage) as due_in 
from my_garage c 
    join scheduled_maintenance sm on c.id=sm.carId 
    left outer join service_history sh on sh.description=sm.service and sh.carId=sm.carId 
where sm.carId=? 
group by sm.id, sm.service, sm.mileage, sm.months`;

const UPCOMING_SERVICE_SQL = `select * from (${SERVICE_DUE_SQL}) as s where due_in<500 order by due_in desc`;

export { SERVICE_DUE_SQL, UPCOMING_SERVICE_SQL}