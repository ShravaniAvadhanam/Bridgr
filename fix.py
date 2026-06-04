with open('src/App.tsx', 'r') as f:
    content = f.read()

content = content.replace('</ReleasesContext.Provider>', '')
content = content.replace('<ReleasesContext.Provider value={releases}>', '')

# Now properly wrap the Platform component
platform_code_old = """  if (step === 4) {
    return (
      <Platform"""

platform_code_new = """  if (step === 4) {
    return (
      <ReleasesContext.Provider value={releases}>
      <Platform"""

content = content.replace(platform_code_old, platform_code_new)

platform_code_end_old = """        focusSaved={focusSaved}
        projectNotice={projectNotice}
      />
    );
  }"""

platform_code_end_new = """        focusSaved={focusSaved}
        projectNotice={projectNotice}
      />
      </ReleasesContext.Provider>
    );
  }"""

content = content.replace(platform_code_end_old, platform_code_end_new)

with open('src/App.tsx', 'w') as f:
    f.write(content)
