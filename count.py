import glob

srcs = [
    "./src/**/*.ts",
    "./src/**/*.tsx",
]

directory_sum = {}
for src in srcs:
    sum = 0
    files = glob.glob(src, recursive=True)
    for file in files :
        with open(file) as fp :
            count = len(fp.read().split("\n"))
            sum += count
            print(f"{file}\t:{count}")
    directory_sum[src] = sum

print("")
total_sum = 0
for (src, sum) in directory_sum.items():
    print(f"{sum}: {src}")
    total_sum += sum
print(total_sum)