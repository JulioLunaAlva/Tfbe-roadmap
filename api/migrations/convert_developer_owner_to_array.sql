
ALTER TABLE initiatives 
ALTER COLUMN developer_owner TYPE TEXT[] 
USING regexp_split_to_array(developer_owner, ',');
