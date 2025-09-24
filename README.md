# Grafana Test

## Alert API
Just started this. Intended to be a alert webhook for Grafana to SQL.  
/alerts is a test endpoint.  
'Vibe' coded at this time.

## MySql
This is just here for testing.

## Grafana
Container is using Named Volumes.  
You can copy files out with something like ```docker cp grafana:/path/in/container ./localpath```.  

Consider adjusting 'min_interval', which should be greater than the base interval.

### SMTP
Settings are located under /etc/grafana/grafana.ini
