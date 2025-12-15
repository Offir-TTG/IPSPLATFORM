// Parse the JSON response you provided
const response = {
    "schedules": [
        {
            "id": "aec27da4-08db-4e08-96f5-87bd28fe47c9",
            "enrollment_id": "45e564c5-292f-45c9-9657-fd6bbd307cfd",
            "payment_number": 1,
            "user_name": "Unknown",
            "product_name": "Unknown Product"
        },
        {
            "id": "059d14a0-4593-4c16-ba58-c7f630b9f5ca",
            "enrollment_id": "fe8cc3d2-5e25-4752-8b2d-70dda4ad5855",
            "payment_number": 1,
            "user_name": "Unknown",
            "product_name": "Unknown Product"
        },
        {
            "id": "4b359eb9-ef71-4bd0-8768-da3eec3983e2",
            "enrollment_id": "7051d98f-6709-403a-9fbd-b4a7dcaa6e73",
            "payment_number": 1,
            "user_name": "Unknown",
            "product_name": "Unknown Product"
        },
        {
            "id": "b70c5df9-9db1-496c-a142-77ebd4ed795a",
            "enrollment_id": "45e564c5-292f-45c9-9657-fd6bbd307cfd",
            "payment_number": 2,
            "user_name": "Unknown",
            "product_name": "Unknown Product"
        },
        {
            "id": "502621aa-a3c5-4e96-95c9-4885c9b5511d",
            "enrollment_id": "fe8cc3d2-5e25-4752-8b2d-70dda4ad5855",
            "payment_number": 2,
            "user_name": "Unknown",
            "product_name": "Unknown Product"
        },
        {
            "id": "d048b844-fd85-4efb-a55e-928b5201a468",
            "enrollment_id": "7051d98f-6709-403a-9fbd-b4a7dcaa6e73",
            "payment_number": 2,
            "user_name": "Unknown",
            "product_name": "Unknown Product"
        }
    ]
};

console.log('Checking for duplicate IDs in the API response...\n');

const ids = response.schedules.map(s => s.id);
const uniqueIds = new Set(ids);

console.log('Total schedules:', ids.length);
console.log('Unique IDs:', uniqueIds.size);

if (uniqueIds.size !== ids.length) {
    console.log('\n❌ DUPLICATES FOUND!');

    const idCounts: Record<string, number> = {};
    ids.forEach(id => {
        idCounts[id] = (idCounts[id] || 0) + 1;
    });

    console.log('\nDuplicate IDs:');
    Object.entries(idCounts)
        .filter(([_, count]) => count > 1)
        .forEach(([id, count]) => {
            console.log(`  ${id}: appears ${count} times`);
        });
} else {
    console.log('\n✅ No duplicate IDs found');
    console.log('\nWhat you\'re seeing is NOT duplicates - these are DIFFERENT payment schedules:');
    console.log('  - 3 enrollments (different students)');
    console.log('  - Each enrollment has multiple payments (deposit + installments)');
    console.log('  - Payment #1, #2, #3, etc. for each enrollment');
    console.log('\nEnrollment breakdown:');

    const byEnrollment: Record<string, any[]> = {};
    response.schedules.forEach(s => {
        if (!byEnrollment[s.enrollment_id]) {
            byEnrollment[s.enrollment_id] = [];
        }
        byEnrollment[s.enrollment_id].push(s);
    });

    Object.entries(byEnrollment).forEach(([enrollmentId, schedules]) => {
        console.log(`\n  Enrollment ${enrollmentId.substring(0, 8)}...`);
        console.log(`    ${schedules.length} payment schedules (Payment #${schedules.map(s => s.payment_number).join(', #')})`);
    });
}
