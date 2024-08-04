# Examples  

INSERT a new country
```bash
curl \
-H "Content-Type: application/json" \
-d '{"Name": "Romania"}' \
-X POST http://classwork.engr.oregonstate.edu:4669/api/countries
```

INSERT developer 47
```bash
curl \
-H "Content-Type: application/json" \
-d '{"DeveloperId": "47", "DevType": "Professional", "Country": "Romania" }' \
-X POST http://classwork.engr.oregonstate.edu:4669/api/developers
```

INSERT developer 47 into developer-languages
```bash
curl \
-H "Content-Type: application/json" \
-d '{"DeveloperId": "47", "Name": "C#"}' \
-X POST http://classwork.engr.oregonstate.edu:4669/api/developer-languages
```

UPDATE developer 47 in developer-languages
```bash
curl \
-H "Content-Type: application/json" \
-d '{"updateCond": {"DeveloperId": "47", "LanguageId": "3"}, "updateVals": {"HaveWorkedWith": "1", "WantToWorkWith": "1"}}' \
-X PUT http://classwork.engr.oregonstate.edu:4669/api/developer-languages
```

DELETE developer 47
```bash
curl \
-H "Content-Type: application/json" \
-d '{"deleteCond": {"DeveloperId": "47"}}' \
-X DELETE http://classwork.engr.oregonstate.edu:4669/api/developers
```