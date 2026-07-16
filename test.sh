BUCKET_NAME=$1

aws s3api put-object --bucket "$BUCKET_NAME" --key incoming/example --body example.csv

