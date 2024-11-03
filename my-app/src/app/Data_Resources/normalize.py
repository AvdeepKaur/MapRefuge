import pandas as pd
import csv

# Load the CSV file with quotes to handle commas correctly
file_path = 'URNormalizedData.csv'  # Replace with your actual file path
df = pd.read_csv(file_path, quotechar='"')

# Remove any unnecessary white spaces in column headers and values
df.columns = df.columns.str.strip()
df = df.applymap(lambda x: x.strip() if isinstance(x, str) else x)

# Normalize case for all string columns (e.g., make them title case where appropriate)
df['Name of Organization'] = df['Name of Organization'].str.title()
df['Service Type'] = df['Service Type'].str.replace('-', ', ')
df['City/State/ZIP'] = df['City/State/ZIP'].str.upper()
df['Who are these services for? (refugees, asylees, TPS, parolees, any status, etc.)'] = df['Who are these services for? (refugees, asylees, TPS, parolees, any status, etc.)'].str.capitalize()
df['Neighborhood'] = df['Neighborhood'].str.title()
df['Summary of Services'] = df['Summary of Services'].str.capitalize()

# Normalize inconsistent 'Hours' formatting
def normalize_hours(hours):
    if pd.isna(hours):
        return ''
    return hours.replace('‚Äì', '-').replace('\u2013', '-')  # Normalize any special characters in hours

df['Hours'] = df['Hours'].apply(normalize_hours)

# Fill missing phone numbers and addresses where necessary
df['Phone Number (for public to contact)'].fillna('Not Available', inplace=True)
df['Street'].fillna('Not Available', inplace=True)
df['Services offered in these languages'].fillna('English', inplace=True)

# Save the cleaned data to a new CSV file with proper quoting to handle commas in descriptions
df.to_csv('normalized_services.csv', index=False, quoting=csv.QUOTE_ALL, quotechar='"')
print("Normalization complete. Data saved to 'normalized_services.csv'")
